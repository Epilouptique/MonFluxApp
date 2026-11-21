// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Vignette du flux : miniature YouTube d'origine, titre, chaîne, date, durée,
// indicateur vu/non vu et bouton d'enregistrement.

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../theme';
import { dateRelative, dureeLisible } from '../format';
import type { VideoAffichee } from '../types';

type Props = {
  video: VideoAffichee;
  onOuvrir: () => void;
  onEnregistrer: () => void;
};

export default function VignetteVideo({ video, onOuvrir, onEnregistrer }: Props) {
  const vue = video.vueLe != null;
  return (
    <Pressable
      onPress={onOuvrir}
      style={[s.carte, vue && s.carteVue]}
      accessibilityRole="button"
      accessibilityLabel={`${video.titre}, ${video.chaineTitre}${vue ? ', déjà vue' : ''}`}
    >
      <View style={s.zoneImage}>
        {video.miniature ? (
          <Image
            source={{ uri: video.miniature }}
            style={[s.image, vue && s.imageVue]}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.image, s.imageVide]} />
        )}
        {video.dureeS ? (
          <Text style={s.duree}>{dureeLisible(video.dureeS)}</Text>
        ) : null}
        {!vue ? <View style={s.pastilleNeuf} /> : null}
      </View>
      <View style={s.texte}>
        <Text numberOfLines={2} style={[s.titre, vue && s.titreVu]}>
          {video.titre}
        </Text>
        <Text numberOfLines={1} style={s.meta}>
          {video.chaineTitre} · {dateRelative(video.publieLe)}
        </Text>
      </View>
      <Pressable
        onPress={onEnregistrer}
        hitSlop={10}
        style={s.bouton}
        accessibilityRole="button"
        accessibilityLabel={
          video.enregistreeLe ? 'Retirer de À regarder' : 'Enregistrer pour plus tard'
        }
      >
        <Ionicons
          name={video.enregistreeLe ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={video.enregistreeLe ? T.accent : T.texteFaible}
        />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    gap: T.espace,
    padding: T.espace,
    backgroundColor: T.fondCarte,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.trait,
    alignItems: 'center',
  },
  // Une vidéo vue doit se lire comme un second plan : fond plus sombre, miniature
  // atténuée, texte en gris. C'est surtout vrai dans « La totale », où les deux
  // états cohabitent.
  carteVue: { backgroundColor: T.fondCarteVue, opacity: 0.62 },
  imageVue: { opacity: 0.5 },
  zoneImage: { width: 128, aspectRatio: 16 / 9, borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%', backgroundColor: '#000' },
  imageVide: { backgroundColor: T.trait },
  duree: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    color: '#FFF',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  pastilleNeuf: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.accent,
  },
  texte: { flex: 1, gap: 4 },
  titre: { color: T.texte, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  titreVu: { color: T.texteFaible, fontWeight: '400' },
  meta: { color: T.texteFaible, fontSize: 12 },
  bouton: { padding: 4 },
});
