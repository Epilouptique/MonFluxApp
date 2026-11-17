// Tous droits réservés — Hugo Vial-Jaime / Dahu-Concept
//
// Génère les icônes de l'application sans aucune dépendance (encodeur PNG minimal :
// zlib est dans Node). Motif : trois barres empilées — une liste chronologique — dont
// la première est accentuée, pour « ce qui est nouveau arrive en haut ».
// Aucun élément de marque YouTube : interdit sur l'icône d'une application tierce.
//
//   node tools/icones.mjs

import zlib from 'node:zlib';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DOSSIER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const FOND = [0x0e, 0x0e, 0x10, 255];
const CLAIR = [0xf2, 0xf2, 0xf4, 255];
const ACCENT = [0xe0, 0x56, 0x4b, 255];
const RIEN = [0, 0, 0, 0];

/** Canevas RGBA. */
function canevas(taille, fond) {
  const px = Buffer.alloc(taille * taille * 4);
  for (let i = 0; i < taille * taille; i += 1) px.set(fond, i * 4);
  return px;
}

/** Rectangle à coins arrondis, dessiné à la main (anti-aliasing par sur-échantillonnage). */
function rectangle(px, taille, x, y, l, h, rayon, couleur) {
  const dedans = (fx, fy) => {
    const dx = Math.max(x + rayon - fx, 0, fx - (x + l - rayon));
    const dy = Math.max(y + rayon - fy, 0, fy - (y + h - rayon));
    if (fx < x || fx > x + l || fy < y || fy > y + h) return false;
    return dx * dx + dy * dy <= rayon * rayon || (dx === 0 || dy === 0);
  };
  for (let fy = Math.floor(y); fy <= Math.ceil(y + h); fy += 1) {
    for (let fx = Math.floor(x); fx <= Math.ceil(x + l); fx += 1) {
      if (fx < 0 || fy < 0 || fx >= taille || fy >= taille) continue;
      // Quatre échantillons par pixel : suffisant pour des bords droits et des arrondis doux.
      let couverture = 0;
      for (const [ox, oy] of [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ]) {
        if (dedans(fx + ox, fy + oy)) couverture += 0.25;
      }
      if (couverture === 0) continue;
      const i = (fy * taille + fx) * 4;
      for (let c = 0; c < 4; c += 1) {
        px[i + c] = Math.round(px[i + c] * (1 - couverture) + couleur[c] * couverture);
      }
    }
  }
}

function encoderPng(px, taille) {
  const brut = Buffer.alloc(taille * (taille * 4 + 1));
  for (let y = 0; y < taille; y += 1) {
    brut[y * (taille * 4 + 1)] = 0; // filtre « none »
    px.copy(brut, y * (taille * 4 + 1) + 1, y * taille * 4, (y + 1) * taille * 4);
  }
  const bloc = (type, donnees) => {
    const l = Buffer.alloc(4);
    l.writeUInt32BE(donnees.length);
    const corps = Buffer.concat([Buffer.from(type, 'ascii'), donnees]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(corps));
    return Buffer.concat([l, corps, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(taille, 0);
  ihdr.writeUInt32BE(taille, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloc('IHDR', ihdr),
    bloc('IDAT', zlib.deflateSync(brut, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ]);
}

const TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const o of buf) c = TABLE[(c ^ o) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Les trois barres, dimensionnées en proportion de la taille demandée. */
function motif(px, taille, marge) {
  const l = taille - marge * 2;
  const hauteur = l * 0.16;
  const ecart = l * 0.1;
  const depart = (taille - (hauteur * 3 + ecart * 2)) / 2;
  const rayon = hauteur / 2;
  rectangle(px, taille, marge, depart, l, hauteur, rayon, ACCENT);
  rectangle(px, taille, marge, depart + hauteur + ecart, l * 0.78, hauteur, rayon, CLAIR);
  rectangle(
    px,
    taille,
    marge,
    depart + (hauteur + ecart) * 2,
    l * 0.56,
    hauteur,
    rayon,
    CLAIR,
  );
}

function ecrire(nom, taille, fond, marge) {
  const px = canevas(taille, fond);
  motif(px, taille, marge);
  fs.writeFileSync(path.join(DOSSIER, nom), encoderPng(px, taille));
  console.log(`assets/${nom} — ${taille}×${taille}`);
}

// Icône iOS : opaque et sans transparence, Apple la refuse autrement.
ecrire('icon.png', 1024, FOND, 1024 * 0.22);
// Écran de démarrage : motif sur fond transparent, la couleur vient d'app.config.js.
ecrire('splash-icon.png', 1024, RIEN, 1024 * 0.3);
ecrire('favicon.png', 64, FOND, 64 * 0.16);
// Icône adaptative Android, réservée pour plus tard.
ecrire('android-icon-foreground.png', 1024, RIEN, 1024 * 0.3);
