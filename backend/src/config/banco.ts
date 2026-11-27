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

// Adiciona uma coluna a uma tabela que já existe, SOMENTE se ela ainda não tiver essa coluna.
// O "CREATE TABLE IF NOT EXISTS" do esquema.sql não mexe em tabelas prontas, então um banco
// criado antes de uma novidade precisaria ser apagado. Esta função evita isso: ela só
// ACRESCENTA a coluna (os dados que já existem ficam intactos) e pode rodar quantas vezes
// for preciso, pois na segunda vez a coluna já existe e nada acontece.
// (Os nomes vêm sempre do nosso código, nunca do usuário, por isso podem entrar no texto do SQL.)
export function garantirColuna(tabela: string, coluna: string, definicao: string): void {
  const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all() as unknown as Array<{ name: string }>;
  if (!colunas.some((c) => c.name === coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }
}

// Localização dos estabelecimentos no mapa. Os locais antigos ficam com NULL (sem localização).
garantirColuna('Estabelecimento', 'latitude', 'REAL CHECK (latitude BETWEEN -90 AND 90)');
garantirColuna('Estabelecimento', 'longitude', 'REAL CHECK (longitude BETWEEN -180 AND 180)');

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
