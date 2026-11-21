// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Lecteur : IFrame Player API officielle dans une WebView — WKWebView sur iOS, WebView
// système sur Android, le code est le même. Le lecteur YouTube garde
// ses fonctions (commandes, plein écran, liens, publicités) ; nous n'en retirons rien,
// nous écoutons les changements d'état pour marquer la vidéo comme vue.
//
// Seule exception : les sous-titres sont désactivés au chargement. Le lecteur applique
// autrement la préférence du compte YouTube, qui les impose à chaque vidéo.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as db from '../../src/db';
import { useEtat } from '../../src/etat';
import { T } from '../../src/theme';
import { dateRelative } from '../../src/format';
import type { VideoAffichee } from '../../src/types';

/**
 * Origine depuis laquelle la page du lecteur est servie. Surtout PAS youtube.com :
 * l'intégration se retrouverait sur la même origine que la page qui la contient, ce
 * qui lui permet de rediriger la WebView entière vers m.youtube.com. Symptômes
 * observés : erreur « 152-4 », titre de la page mobile visible, cadrage coupé.
 * N'importe quelle autre origine https convient, comme pour n'importe quel site.
 */
const ORIGINE = 'https://dahu-concept.fr';

/** Page minimale servie à la WebView, qui porte l'IFrame Player API. */
function pageLecteur(videoId: string, lectureAuto: boolean): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html,body{margin:0;background:#000;height:100%;overflow:hidden}
  #l{width:100%;height:100%}
  /* L'API crée l'iframe en 640x390 par défaut : sans cette règle, le lecteur déborde
     du cadre et apparaît coupé. */
  iframe{width:100%!important;height:100%!important;border:0;display:block}
</style>
</head><body><div id="l"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
  function post(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  function onYouTubeIframeAPIReady(){
    new YT.Player('l', {
      videoId: ${JSON.stringify(videoId)},
      width: '100%',
      height: '100%',
      playerVars: {
        // La WebView autorise la lecture sans geste préalable (mediaPlaybackRequires
        // UserAction à false), donc le son part bien dès le début.
        autoplay: ${lectureAuto ? 1 : 0},
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        // Doit correspondre à l'origine réelle de la page, sans quoi l'API refuse de
        // dialoguer avec l'intégration.
        origin: ${JSON.stringify(ORIGINE)},
        enablejsapi: 1,
        // 0 = ne pas forcer les sous-titres. Ne suffit pas toujours : le lecteur
        // applique aussi la préférence du compte YouTube, d'où unloadModule ci-dessous.
        cc_load_policy: 0,
        hl: 'fr',
        // Bouton de plein écran de YouTube masqué : il s'appuie sur l'API de plein
        // écran du navigateur, que WKWebView refuse à une page embarquée. Le laisser
        // visible donnerait deux commandes dont une inopérante, qui se contrediraient.
        fs: 0
      },
      events: {
        onReady: function(e){
          // Décharge le module de sous-titres : c'est le seul moyen fiable de passer
          // outre une préférence de compte qui les active systématiquement.
          try { e.target.unloadModule('captions'); e.target.unloadModule('cc'); } catch (x) {}
          post({ type: 'pret' });
        },
        onStateChange: function(e){
          // iOS n'autorise le démarrage automatique qu'en sourdine : on rétablit le
          // son dès que la lecture est réellement lancée.
          if (e.data === 1) {
            try { e.target.unMute(); e.target.setVolume(100); } catch (x) {}
          }
          post({ type: 'etat', etat: e.data });
        },
        onError: function(e){ post({ type: 'erreur', code: e.data }); }
      }
    });
  }
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
</script></body></html>`;
}

/**
 * Codes d'erreur de l'API IFrame. Seuls 101 et 150 sont définitifs — le propriétaire
 * interdit la lecture hors de YouTube. Les autres sont souvent transitoires et suivis
 * d'une lecture normale : les annoncer ferait peur pour rien.
 */
function messageErreur(code: number): string | null {
  if (code === 101 || code === 150) {
    return 'Le propriétaire de cette vidéo en interdit la lecture hors de YouTube.';
  }
  if (code === 100) return 'Cette vidéo a été supprimée ou rendue privée.';
  return null;
}

export default function Lecteur() {
  const { width: largeurEcran, height: hauteurEcran } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { signalerChangement, revision, lancerDirect } = useEtat();
  const [video, setVideo] = useState<VideoAffichee | null>(null);
  /** Vrai une fois la vidéo cherchée en base : on attend de connaître son format
   *  avant de monter le lecteur, sinon un Short s'afficherait d'abord en paysage. */
  const [charge, setCharge] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pleinEcran, setPleinEcran] = useState(false);
  const dejaMarquee = useRef(false);
  const estShort = video?.estShort === 1;

  /**
   * Plein écran maison. Celui du lecteur YouTube repose sur l'API de plein écran du
   * navigateur, que WKWebView n'accorde pas à une page embarquée : le bouton ne fait
   * rien. On agrandit donc nous-mêmes le cadre.
   *
   * Pour une vidéo classique, on pivote le cadre d'un quart de tour : c'est ce qui
   * donne une vraie image en paysage, la largeur de l'écran étant sinon la limite.
   * Faire tourner l'appareil lui-même demanderait expo-screen-orientation, donc un
   * module natif et un nouveau build. Un Short, lui, est vertical : il occupe l'écran
   * tel quel, sans rotation.
   */
  const cadrePleinEcran = estShort
    ? // Un Short occupe toute la hauteur ; sa largeur en découle et le cadre est
      // centré, sinon la vidéo se retrouve collée à gauche entre deux bandes noires.
      {
        position: 'absolute' as const,
        top: 0,
        left: Math.max(0, (largeurEcran - hauteurEcran * (9 / 16)) / 2),
        width: Math.min(largeurEcran, hauteurEcran * (9 / 16)),
        height: hauteurEcran,
      }
    : {
        position: 'absolute' as const,
        left: (largeurEcran - hauteurEcran) / 2,
        top: (hauteurEcran - largeurEcran) / 2,
        width: hauteurEcran,
        height: largeurEcran,
        transform: [{ rotate: '90deg' }],
      };

  /**
   * Cadre d'un Short hors plein écran : hauteur plafonnée pour laisser le titre et les
   * actions visibles, largeur déduite du format vertical, et centré. Un simple
   * aspectRatio avec maxHeight déformait le cadre dès que le plafond s'appliquait,
   * d'où la vidéo réduite et alignée à gauche.
   */
  const hauteurShort = Math.min(largeurEcran * (16 / 9), hauteurEcran * 0.62);
  const cadreShort = {
    width: hauteurShort * (9 / 16),
    height: hauteurShort,
    alignSelf: 'center' as const,
  };

  useEffect(() => {
    void (async () => {
      // On relit depuis la liste complète : une seule requête, pas de vue dédiée.
      const toutes = await db.listerFlux({
        afficherShorts: true,
        afficherVues: true,
        limite: 1000,
      });
      setVideo(toutes.find((v) => v.id === id) ?? null);
      setCharge(true);
    })();
  }, [id, revision]);

  /** Sortie du plein écran : retour à la liste en lancement direct, puisque c'est de
   *  là qu'on vient et qu'il n'y a rien à faire sur l'écran intermédiaire. */
  const quitterPleinEcran = useCallback(() => {
    if (lancerDirect) router.back();
    else setPleinEcran(false);
  }, [lancerDirect, router]);

  /**
   * Bouton retour matériel d'Android, qui n'a pas d'équivalent sur iPhone. En plein
   * écran il réduit, comme dans n'importe quel lecteur vidéo ; sans cela il quitterait
   * l'écran d'un coup, ce qui surprend. Hors plein écran, comportement par défaut.
   */
  useEffect(() => {
    if (Platform.OS !== 'android' || !pleinEcran) return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      quitterPleinEcran();
      return true;
    });
    return () => abonnement.remove();
  }, [pleinEcran, quitterPleinEcran]);

  const marquerVue = useCallback(async () => {
    if (dejaMarquee.current || !id) return;
    dejaMarquee.current = true;
    await db.marquerVue(id, true);
    signalerChangement();
  }, [id, signalerChangement]);

  return (
    <View style={s.page}>
      <Stack.Screen options={{ headerShown: !pleinEcran }} />
      <StatusBar hidden={pleinEcran} />
      <View style={[s.lecteur, estShort && cadreShort, pleinEcran && cadrePleinEcran]}>
        {id && charge ? (
          <WebView
            source={{ html: pageLecteur(id, lancerDirect), baseUrl: ORIGINE }}
            originWhitelist={['https://*']}
            // La WebView ne doit jamais quitter la page du lecteur. Les liens du
            // lecteur (chaîne, « Regarder sur YouTube », recommandations) partent dans
            // l'application YouTube ou Safari, pas dans notre cadre.
            onShouldStartLoadWithRequest={(requete) => {
              const u = requete.url;
              if (
                u.startsWith('about:') ||
                u.startsWith(ORIGINE) ||
                u.includes('youtube.com/embed/') ||
                u.includes('googlevideo.com') ||
                u.includes('youtube.com/iframe_api') ||
                u.includes('ytimg.com')
              ) {
                return true;
              }
              if (u.startsWith('http')) void Linking.openURL(u);
              return false;
            }}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            // Les liens du lecteur (chaîne, recommandations de fin) s'ouvrent dans Safari
            // plutôt que de remplacer la page du lecteur.
            setSupportMultipleWindows={false}
            style={s.webview}
            onMessage={(e) => {
              try {
                const m = JSON.parse(e.nativeEvent.data) as {
                  type: string;
                  etat?: number;
                  code?: number;
                };
                if (m.type === 'etat') {
                  // 1 = lecture en cours : c'est le signal « regardée » retenu.
                  if (m.etat === 1 || m.etat === 0) void marquerVue();
                  if (m.etat === 1) {
                    // La lecture démarre : toute erreur précédente était transitoire,
                    // et c'est le moment de passer en grand.
                    setMessage(null);
                    setPleinEcran(true);
                  }
                }
                if (m.type === 'erreur') setMessage(messageErreur(m.code ?? 0));
              } catch {
                // Message inattendu : sans effet.
              }
            }}
          />
        ) : null}
        {/* Les deux seuls éléments que nous superposons au lecteur. Ils vivent dans
            le cadre, donc ils suivent la rotation du plein écran et restent lisibles.
            Retour en haut à gauche, plein écran en bas à droite : les emplacements
            attendus, ceux de tous les lecteurs vidéo. */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={[s.commande, s.retour]}
          accessibilityLabel="Revenir à la liste"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
        {pleinEcran ? (
          <Pressable
            onPress={quitterPleinEcran}
            hitSlop={16}
            style={[s.commande, s.sortie]}
            accessibilityLabel="Quitter le plein écran"
            accessibilityRole="button"
          >
            <Ionicons name="contract-outline" size={28} color="#FFF" />
          </Pressable>
        ) : null}
      </View>
      {!pleinEcran ? (
        <Pressable style={s.agrandir} onPress={() => setPleinEcran(true)}>
          <Ionicons name="expand-outline" size={16} color={T.texteFaible} />
          <Text style={s.agrandirTexte}>Plein écran</Text>
        </Pressable>
      ) : null}
      {message && !pleinEcran ? (
        <View style={s.blocErreur}>
          <Text style={s.erreur}>{message}</Text>
          <Pressable
            onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${id}`)}
          >
            <Text style={s.lien}>Ouvrir dans YouTube</Text>
          </Pressable>
        </View>
      ) : null}
      {video && !pleinEcran ? (
        <View style={s.infos}>
          <Text style={s.titre}>{video.titre}</Text>
          <Text style={s.meta}>
            {video.chaineTitre} · {dateRelative(video.publieLe)}
          </Text>
          <View style={s.actions}>
            <Pressable
              style={s.action}
              onPress={async () => {
                await db.basculerEnregistrement(video.id);
                signalerChangement();
              }}
            >
              <Ionicons
                name={video.enregistreeLe ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={video.enregistreeLe ? T.accent : T.texte}
              />
              <Text style={s.actionTexte}>
                {video.enregistreeLe ? 'Enregistrée' : 'Enregistrer'}
              </Text>
            </Pressable>
            <Pressable
              style={s.action}
              onPress={async () => {
                await db.marquerVue(video.id, video.vueLe == null);
                dejaMarquee.current = video.vueLe == null;
                signalerChangement();
              }}
            >
              <Ionicons
                name={video.vueLe ? 'eye' : 'eye-outline'}
                size={18}
                color={video.vueLe ? T.accent : T.texte}
              />
              <Text style={s.actionTexte}>
                {video.vueLe ? 'Vue' : 'Marquer comme vue'}
              </Text>
            </Pressable>
            <Pressable
              style={s.action}
              onPress={() =>
                void Share.share({
                  message: `${video.titre}\nhttps://www.youtube.com/watch?v=${video.id}`,
                })
              }
            >
              <Ionicons name="share-outline" size={18} color={T.texte} />
              <Text style={s.actionTexte}>Partager</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.fond },
  lecteur: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  infos: { padding: T.espace, gap: 8 },
  titre: { color: T.texte, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  meta: { color: T.texteFaible, fontSize: 13 },
  // flexWrap : sur un petit écran, « Partager » passe à la ligne au lieu d'être
  // tronqué par le bord droit.
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, rowGap: 12, marginTop: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionTexte: { color: T.texte, fontSize: 14 },
  commande: {
    position: 'absolute',
    padding: 11,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  retour: { top: 12, left: 12 },
  sortie: { bottom: 12, right: 12 },
  agrandir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  agrandirTexte: { color: T.texteFaible, fontSize: 13 },
  blocErreur: {
    padding: T.espace,
    gap: 6,
    backgroundColor: T.accentFaible,
  },
  erreur: { color: T.texte, fontSize: 13, lineHeight: 19 },
  lien: { color: T.accent, fontSize: 13, fontWeight: '600' },
});
