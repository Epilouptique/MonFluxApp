// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
// Relit la configuration Expo résolue et vérifie ce qui doit l'être avant un build :
// identité du projet EAS, identifiants applicatifs et schémas de retour OAuth.
//   tools\verif-config.bat

import fs from 'node:fs';

const j = JSON.parse(fs.readFileSync(new URL('../.expo/config-verif.json', import.meta.url)));
const schemas = j.ios?.infoPlist?.CFBundleURLTypes?.[0]?.CFBundleURLSchemes ?? [];
const schemesConfig = Array.isArray(j.scheme) ? j.scheme : [j.scheme].filter(Boolean);

console.log(`nom          ${j.name}`);
console.log(`slug         ${j.slug}`);
console.log(`owner        ${j.owner}`);
console.log(`version      ${j.version}`);
console.log(`projectId    ${j.extra?.eas?.projectId}`);
console.log(`bundle iOS   ${j.ios?.bundleIdentifier}`);
console.log(`paquet       ${j.android?.package}`);
console.log(`schémas      ${schemesConfig.join(', ') || '(aucun)'}`);
console.log(`schémas iOS  ${schemas.join(', ') || '(aucun)'}`);
console.log(`icône adapt. ${j.android?.adaptiveIcon ? 'oui' : 'NON'}`);

let souci = false;

const clientIos = j.extra?.googleIosClientId ?? '';
const attenduIos = clientIos ? clientIos.split('.').reverse().join('.') : '';
if (!clientIos) {
  console.log('\niOS      : client Google non renseigné.');
  souci = true;
} else if (schemas.includes(attenduIos)) {
  console.log('\niOS      : client Google et schéma de retour concordants.');
} else {
  console.log(`\niOS      : ATTENTION, schéma attendu « ${attenduIos} », absent.`);
  souci = true;
}

const clientAndroid = j.extra?.googleAndroidClientId ?? '';
const paquet = j.android?.package ?? '';
if (!clientAndroid) {
  console.log(
    'Android  : client Google non renseigné. Le build passe, la connexion échouera.',
  );
} else if (schemesConfig.includes(paquet)) {
  console.log('Android  : client Google présent, et le nom de paquet est un schéma.');
} else {
  console.log(`Android  : ATTENTION, le schéma « ${paquet} » manque dans « scheme ».`);
  souci = true;
}

if (souci) process.exitCode = 1;
