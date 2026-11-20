// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Premier écran : liaison du compte Google. Rien d'autre n'est demandé que la lecture
// des abonnements, et c'est dit ici plutôt que dans des conditions d'utilisation.

import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEtat } from '../etat';
import { T } from '../theme';

export default function Connexion() {
  const { connecter, erreur } = useEtat();
  const [enCours, setEnCours] = useState(false);
  return (
    <SafeAreaView style={s.page}>
      <View style={s.bloc}>
        <Text style={s.titre}>Mon Flux</Text>
        <Text style={s.sous}>
          Les nouvelles vidéos de tes abonnements YouTube, dans l’ordre chronologique.
          Pas de recommandations, pas de page d’accueil, pas de fil sans fin.
        </Text>
        <Text style={s.detail}>
          La connexion Google sert uniquement à lire la liste de tes abonnements.
          L’historique de lecture reste sur cet appareil et n’est jamais envoyé à
          YouTube.
        </Text>
        {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}
        <Pressable
          style={s.bouton}
          disabled={enCours}
          onPress={async () => {
            setEnCours(true);
            try {
              await connecter();
            } finally {
              setEnCours(false);
            }
          }}
        >
          {enCours ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={s.boutonTexte}>Se connecter avec Google</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.fond, justifyContent: 'center' },
  bloc: { padding: 28, gap: 16 },
  titre: { color: T.texte, fontSize: 30, fontWeight: '700' },
  sous: { color: T.texte, fontSize: 15, lineHeight: 22 },
  detail: { color: T.texteFaible, fontSize: 13, lineHeight: 19 },
  erreur: { color: T.accent, fontSize: 13, lineHeight: 19 },
  bouton: {
    marginTop: 8,
    backgroundColor: T.accent,
    paddingVertical: 14,
    borderRadius: T.rayon,
    alignItems: 'center',
  },
  boutonTexte: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
