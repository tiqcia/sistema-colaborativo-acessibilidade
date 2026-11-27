// Conexão com o banco SQLite.
// Usa o SQLite que já vem embutido no Node (módulo "node:sqlite"):
// não precisa instalar nada nem compilar nada.
//
// Este é o ÚNICO arquivo que conhece o driver do banco. Se um dia quiserem
// trocar por "better-sqlite3", é só mudar o import abaixo e o "new".
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CAMINHO_BANCO } from './ambiente.ts';

if (CAMINHO_BANCO !== ':memory:') {
  fs.mkdirSync(path.dirname(CAMINHO_BANCO), { recursive: true });
}

export const db = new DatabaseSync(CAMINHO_BANCO);

// O SQLite só respeita as chaves estrangeiras (FOREIGN KEY) se isto estiver ligado.
db.exec('PRAGMA foreign_keys = ON');

// Cria as tabelas (se ainda não existirem) e o usuário anônimo.
db.exec(fs.readFileSync(path.join(import.meta.dirname, 'esquema.sql'), 'utf8'));

// Migração compatível com bancos existentes: adiciona coordenadas, se necessário.
for (const coluna of ['latitude', 'longitude']) {
  try {
    db.exec(`ALTER TABLE Estabelecimento ADD COLUMN ${coluna} REAL`);
  } catch (erro) {
    // SQLite sinaliza coluna duplicada quando a migração já foi aplicada.
    if (!(erro instanceof Error) || !erro.message.includes('duplicate column name')) throw erro;
  }
}

// Executa vários comandos como um só: ou tudo dá certo, ou nada é gravado.
export function emTransacao<T>(funcao: () => T): T {
  db.exec('BEGIN');
  try {
    const resultado = funcao();
    db.exec('COMMIT');
    return resultado;
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}
