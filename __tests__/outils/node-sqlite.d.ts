// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
//
// Déclaration de la seule part de node:sqlite utilisée par les tests. Préférée à
// @types/node : celui-ci ferait entrer les globales de Node dans le typage de
// l'application, où elles n'ont rien à faire.

declare module 'node:sqlite' {
  type Parametre = string | number | null;

  type Requete = {
    run(...params: Parametre[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    all(...params: Parametre[]): unknown[];
    get(...params: Parametre[]): unknown;
  };

  export class DatabaseSync {
    constructor(chemin: string);
    exec(sql: string): void;
    prepare(sql: string): Requete;
  }
}
