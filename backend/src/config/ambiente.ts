// Configurações lidas do ambiente (arquivo .env, se existir).
import path from 'node:path';

// Pasta "backend/" (duas pastas acima de src/config)
const RAIZ = path.join(import.meta.dirname, '..', '..');

// Carrega o arquivo .env, se existir. Variáveis que já estejam definidas
// no sistema não são sobrescritas. Se não existir .env, usamos os padrões.
try {
  process.loadEnvFile(path.join(RAIZ, '.env'));
} catch {
  // sem .env: tudo bem
}

export const PORTA: number = Number(process.env.PORTA) || 3000;

// ':memory:' cria um banco temporário só na memória (usado nos testes).
export const CAMINHO_BANCO: string =
  process.env.CAMINHO_BANCO === ':memory:'
    ? ':memory:'
    : path.resolve(RAIZ, process.env.CAMINHO_BANCO || path.join('data', 'acessibilidade.db'));
