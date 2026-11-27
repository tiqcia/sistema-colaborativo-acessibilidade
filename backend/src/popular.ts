// Entrada do comando  npm run popular
import { popular } from './config/popularBanco.ts';

console.log(popular() ? 'Dados de exemplo inseridos.' : 'O banco já tem estabelecimentos; nada foi inserido.');
