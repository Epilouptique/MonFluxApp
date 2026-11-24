// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Glissement sur une vignette : vers la droite pour enregistrer dans « À regarder »,
// vers la gauche pour marquer comme vue.
//
// Réalisé avec PanResponder et Animated, tous deux fournis par React Native. Une
// bibliothèque de gestes demanderait un module natif, donc un nouveau build à chaque
// machine ; ici le déplacement passe par le pilote natif et reste fluide sans cela.

import React, { useMemo } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../theme';

/** Déplacement au-delà duquel l'action est déclenchée au relâchement. */
const SEUIL = 54;
/** En deçà, c'est un défilement vertical : on ne prend pas la main. */
const AMORCE = 8;

type Props = {
  enregistree: boolean;
  vue: boolean;
  onEnregistrer: () => void;
  onMarquerVue: () => void;
  children: React.ReactNode;
};

export default function VignetteGlissante({
  enregistree,
  vue,
  onEnregistrer,
  onMarquerVue,
  children,
}: Props) {
  // useMemo et non useRef : l'objet n'est construit qu'une fois, et React n'a pas à
  // traverser une référence pendant le rendu pour lire la valeur animée.
  const x = useMemo(() => new Animated.Value(0), []);
  // Les libellés doivent refléter l'état courant : glisser sur une vidéo déjà
  // enregistrée la retire, c'est une bascule et non un ajout systématique.
  const actions = {
    droite: {
      libelle: enregistree ? 'Retirer' : 'À regarder',
      icone: enregistree ? ('bookmark' as const) : ('bookmark-outline' as const),
      fond: '#1F3A2C',
      teinte: '#7FD6A2',
    },
    gauche: {
      libelle: vue ? 'Non vue' : 'Vue',
      icone: vue ? ('eye-off-outline' as const) : ('eye-outline' as const),
      fond: '#2A2A33',
      teinte: T.texteFaible,
    },
  };

  const repondeur = useMemo(
    () =>
      PanResponder.create({
        // On ne capte que les gestes nettement horizontaux, pour ne jamais bloquer
        // le défilement vertical de la liste.
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > AMORCE && Math.abs(g.dx) > Math.abs(g.dy) * 1.1,
        // Capture avant la liste : sans cela, le défilement vertical récupère le geste
        // dès qu'il part légèrement de travers, et la vignette revient en place.
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          Math.abs(g.dx) > AMORCE && Math.abs(g.dx) > Math.abs(g.dy) * 1.1,
        // La liste demande la main en cours de geste : on refuse. C'est ce qui rendait
        // le glissement vers la gauche si difficile à mener jusqu'au bout.
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_e, g) => {
          // Résistance légère au-delà du seuil : on sent qu'on y est sans être freiné.
          const brut = g.dx;
          const amorti =
            Math.abs(brut) <= SEUIL
              ? brut
              : Math.sign(brut) * (SEUIL + (Math.abs(brut) - SEUIL) * 0.6);
          x.setValue(amorti);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dx > SEUIL) onEnregistrer();
          else if (g.dx < -SEUIL) onMarquerVue();
          Animated.spring(x, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 12,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(x, { toValue: 0, useNativeDriver: true, speed: 18 }).start();
        },
      }),
    [onEnregistrer, onMarquerVue, x],
  );

  // Le fond ne se révèle qu'à partir d'un vrai déplacement, et s'affirme au seuil.
  const opaciteDroite = x.interpolate({
    inputRange: [0, AMORCE, SEUIL],
    outputRange: [0, 0.35, 1],
    extrapolate: 'clamp',
  });
  const opaciteGauche = x.interpolate({
    inputRange: [-SEUIL, -AMORCE, 0],
    outputRange: [1, 0.35, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.cadre}>
      <Animated.View
        style={[s.fond, { backgroundColor: actions.droite.fond, opacity: opaciteDroite }]}
      >
        <View style={s.marqueur}>
          <Ionicons name={actions.droite.icone} size={20} color={actions.droite.teinte} />
          <Text style={[s.libelle, { color: actions.droite.teinte }]}>
            {actions.droite.libelle}
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        style={[
          s.fond,
          s.fondGauche,
          { backgroundColor: actions.gauche.fond, opacity: opaciteGauche },
        ]}
      >
        <View style={s.marqueur}>
          <Ionicons name={actions.gauche.icone} size={20} color={actions.gauche.teinte} />
          <Text style={[s.libelle, { color: actions.gauche.teinte }]}>
            {actions.gauche.libelle}
          </Text>
        </View>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...repondeur.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  cadre: { position: 'relative' },
  fond: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  fondGauche: { alignItems: 'flex-end' },
  marqueur: { alignItems: 'center', gap: 2 },
  libelle: { fontSize: 11, fontWeight: '600' },
});
