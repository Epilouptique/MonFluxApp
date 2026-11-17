// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Relit la configuration Expo résolue et vérifie ce qui doit l'être avant un build :
// identité du projet EAS, identifiant de l'offre groupée et schéma de retour OAuth.
//   tools\verif-config.bat

import fs from 'node:fs';

const j = JSON.parse(fs.readFileSync(new URL('../.expo/config-verif.json', import.meta.url)));
const schemas = j.ios?.infoPlist?.CFBundleURLTypes?.[0]?.CFBundleURLSchemes ?? [];

console.log(`nom         ${j.name}`);
console.log(`slug        ${j.slug}`);
console.log(`owner       ${j.owner}`);
console.log(`projectId   ${j.extra?.eas?.projectId}`);
console.log(`bundle iOS  ${j.ios?.bundleIdentifier}`);
console.log(`schémas     ${schemas.join(', ') || '(aucun)'}`);

const client = j.extra?.googleIosClientId ?? '';
const attendu = client ? client.split('.').reverse().join('.') : '';
if (!client || client.startsWith('placeholder')) {
  console.log('\nClient Google : non renseigné (EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID).');
} else if (schemas.includes(attendu)) {
  console.log('\nClient Google et schéma de retour OAuth concordants.');
} else {
  console.log(`\nATTENTION : schéma de retour attendu « ${attendu} », absent de la liste.`);
  process.exitCode = 1;
}
