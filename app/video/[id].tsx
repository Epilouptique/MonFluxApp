// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Lecteur : IFrame Player API officielle dans une WKWebView. Le lecteur YouTube garde
// toutes ses fonctions (commandes, sous-titres, plein écran, liens, publicités) ; nous
// n'en retirons rien, nous écoutons seulement les changements d'état pour marquer la
// vidéo comme vue.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as db from '../../src/db';
import { useEtat } from '../../src/etat';
import { T } from '../../src/theme';
import { dateRelative } from '../../src/format';
import type { VideoAffichee } from '../../src/types';

/** Page minimale servie à la WebView. L'origine doit être youtube.com pour l'API IFrame. */
function pageLecteur(videoId: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>html,body{margin:0;background:#000;height:100%;overflow:hidden}#l{width:100%;height:100%}</style>
</head><body><div id="l"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
  function post(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  function onYouTubeIframeAPIReady(){
    new YT.Player('l', {
      videoId: ${JSON.stringify(videoId)},
      playerVars: { playsinline: 1, modestbranding: 1, rel: 0 },
      events: {
        onReady: function(){ post({ type: 'pret' }); },
        onStateChange: function(e){ post({ type: 'etat', etat: e.data }); },
        onError: function(e){ post({ type: 'erreur', code: e.data }); }
      }
    });
  }
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
</script></body></html>`;
}

export default function Lecteur() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { signalerChangement, revision } = useEtat();
  const [video, setVideo] = useState<VideoAffichee | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dejaMarquee = useRef(false);

  useEffect(() => {
    void (async () => {
      // On relit depuis la liste complète : une seule requête, pas de vue dédiée.
      const toutes = await db.listerFlux({
        afficherShorts: true,
        afficherVues: true,
        limite: 1000,
      });
      setVideo(toutes.find((v) => v.id === id) ?? null);
    })();
  }, [id, revision]);

  const marquerVue = useCallback(async () => {
    if (dejaMarquee.current || !id) return;
    dejaMarquee.current = true;
    await db.marquerVue(id, true);
    signalerChangement();
  }, [id, signalerChangement]);

  return (
    <View style={s.page}>
      <View style={s.lecteur}>
        {id ? (
          <WebView
            source={{ html: pageLecteur(id), baseUrl: 'https://www.youtube.com' }}
            originWhitelist={['https://*']}
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
                const m = JSON.parse(e.nativeEvent.data) as { type: string; etat?: number };
                // 1 = lecture en cours : c'est le signal « regardée » retenu.
                if (m.type === 'etat' && (m.etat === 1 || m.etat === 0)) void marquerVue();
                if (m.type === 'erreur') setMessage('Cette vidéo ne peut pas être lue ici.');
              } catch {
                // Message inattendu : sans effet.
              }
            }}
          />
        ) : null}
      </View>
      {message ? <Text style={s.erreur}>{message}</Text> : null}
      {video ? (
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
  actions: { flexDirection: 'row', gap: 20, marginTop: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionTexte: { color: T.texte, fontSize: 14 },
  erreur: { color: T.accent, padding: T.espace, fontSize: 13 },
});
