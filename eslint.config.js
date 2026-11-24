// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
// Configuration ESLint - https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Dossiers produits par une commande, jamais écrits à la main : les analyser ne
    // signale que des défauts qu'on ne peut pas corriger à la source.
    ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*', 'coverage/*'],
  },
  {
    // Les scripts de tools/ tournent sous Node, pas dans l'application : ils ont droit
    // à Buffer, process et console.
    files: ['tools/**/*.{js,mjs,cjs}', '*.config.js', 'plugins/**/*.js'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        module: 'writable',
        require: 'readonly',
      },
    },
  },
  {
    files: ['__tests__/**/*.{ts,tsx}'],
    rules: {
      // jest.mock() est remonté au-dessus des imports par Babel : l'ordre du fichier
      // n'est donc pas celui de l'exécution, et la règle ne s'applique pas ici.
      'import/first': 'off',
      // require() est imposé par Jest : une fabrique de mock, et la relecture d'un
      // module après resetModules, qu'un import statique ne permet pas de refaire.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
