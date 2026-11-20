const { withAppBuildGradle } = require('expo/config-plugins');

// React Native épingle CMake 3.22.1, dont le ninja (1.10.2) ne sait pas créer de
// chemin de plus de 260 caractères. Or CMake recopie le chemin absolu des sources
// sous .cxx, ce qui dépasse 300 caractères : la compilation locale échoue sous
// Windows, même avec LongPathsEnabled, puisque le binaire lui-même n'en tient pas
// compte. CMake 3.31.6 embarque ninja 1.12.1, qui les gère.
//
// Sans effet sur les builds EAS, qui tournent sous Linux et ignorent cette limite.
const VERSION_CMAKE = '3.31.6';
const MARQUEUR = '// version de CMake imposee par plugins/cmake-version.js';

module.exports = function withVersionCmake(config) {
  return withAppBuildGradle(config, (configuration) => {
    const fichier = configuration.modResults;

    if (fichier.language !== 'groovy') {
      throw new Error(
        `plugins/cmake-version.js attend un build.gradle en Groovy, recu « ${fichier.language} ».`,
      );
    }

    if (fichier.contents.includes(MARQUEUR)) return configuration;

    const avant = fichier.contents;
    fichier.contents = avant.replace(
      /android\s*\{/,
      `android {\n    ${MARQUEUR}\n    externalNativeBuild { cmake { version "${VERSION_CMAKE}" } }`,
    );

    if (fichier.contents === avant) {
      throw new Error(
        "plugins/cmake-version.js n'a pas trouve le bloc « android { } » dans app/build.gradle.",
      );
    }

    return configuration;
  });
};
