// Mon Flux - Hugo Vial-Jaime / Dahu-Concept - licence MIT, voir LICENSE
//
// Remplace expo-sqlite dans les tests par la base SQLite embarquée de Node. Le moteur
// est le vrai : les requêtes de src/db.ts sont réellement exécutées, dialecte compris.
// Une base simulée aurait laissé passer une faute de SQL sans broncher.

import { DatabaseSync } from 'node:sqlite';

type Parametre = string | number | null;

function adapter(base: DatabaseSync) {
  return {
    async execAsync(sql: string): Promise<void> {
      base.exec(sql);
    },
    async runAsync(sql: string, params: Parametre[] = []) {
      const r = base.prepare(sql).run(...params);
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    async getAllAsync<T>(sql: string, params: Parametre[] = []): Promise<T[]> {
      return base.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, params: Parametre[] = []): Promise<T | null> {
      return (base.prepare(sql).get(...params) as T) ?? null;
    },
    // expo-sqlite ouvre une transaction ; ici le regroupement n'apporte rien au test et
    // imbriquer des transactions ferait échouer SQLite, donc on exécute simplement.
    async withTransactionAsync(travail: () => Promise<void>): Promise<void> {
      await travail();
    },
  };
}

export async function openDatabaseAsync(_nom: string) {
  return adapter(new DatabaseSync(':memory:'));
}
