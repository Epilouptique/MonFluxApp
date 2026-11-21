const { withAppBuildGradle } = require('expo/config-plugins');

// « expo prebuild » dépose dans android/app/ le fichier debug.keystore du gabarit
// React Native, et Gradle signe les builds de debug avec lui. Or ce fichier est le
// même dans tous les projets React Native : son empreinte SHA-1 est publique et
// partagée par le monde entier.
//
// Deux conséquences, la seconde étant la plus gênante :
//
//  1. l'empreinte declarée dans le client OAuth Android ne correspond pas à celle qui
//     signe réellement l'application, et Google répond DEVELOPER_ERROR ;
//  2. déclarer l'empreinte du gabarit la ferait fonctionner, mais autoriserait du même
//     coup n'importe quelle application signée avec cette clé universelle à se faire
//     passer pour celle-ci auprès de Google.
//
// On signe donc avec la clé de debug du profil utilisateur, propre à la machine, dont
// l'empreinte est celle déclarée dans le client « Mon Flux Android (debug local) ».
// Sans effet sur les builds EAS et le Play Store, qui apportent leurs propres clés.
const MARQUEUR = '// cle de debug du profil utilisateur, imposee par plugins/cle-debug.js';
const ORIGINE = "storeFile file('debug.keystore')";
const REMPLACEMENT =
  `${MARQUEUR}\n            storeFile file(System.getProperty('user.home') + '/.android/debug.keystore')`;

module.exports = function withCleDebug(config) {
  return withAppBuildGradle(config, (configuration) => {
    const fichier = configuration.modResults;

    if (fichier.language !== 'groovy') {
      throw new Error(
        `plugins/cle-debug.js attend un build.gradle en Groovy, recu « ${fichier.language} ».`,
      );
    }

    if (fichier.contents.includes(MARQUEUR)) return configuration;

    if (!fichier.contents.includes(ORIGINE)) {
      throw new Error(
        "plugins/cle-debug.js n'a pas trouve la ligne de signature de debug attendue dans app/build.gradle.",
      );
    }

    fichier.contents = fichier.contents.replace(ORIGINE, REMPLACEMENT);
    return configuration;
  });
};
