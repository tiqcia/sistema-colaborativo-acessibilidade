// Funções de apoio para conferir e limpar os dados que chegam do app.
// Os parâmetros são "unknown" de propósito: tudo que vem de fora (JSON, formulário)
// pode ter qualquer tipo, então precisamos CONFERIR antes de usar.

// Tamanhos máximos (em caracteres). Mude aqui se precisar.
// O de "titulo" (80) é o mesmo limite que o app já aplica no formulário.
export const LIMITES = {
  nome: 100,
  endereco: 200,
  categoria: 50,
  descricao: 1000,
  titulo: 80,
  comentario: 2000,
} as const;

// Devolve o texto sem espaços nas pontas. Se não for texto, devolve '' (vazio).
export function lerTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Confere a nota: de 1 a 5, em passos de 0,5. Devolve o número ou null se for inválida.
//
// Por que "nota * 2" ? Porque 0,5 é uma fração exata em binário (1/2), então
// 4.5 * 2 dá exatamente 9. Já 3.7 * 2 = 7.4, que não é inteiro, e é recusado.
export function lerNota(valor: unknown): number | null {
  if (typeof valor !== 'number' && typeof valor !== 'string') return null;
  if (typeof valor === 'string' && valor.trim() === '') return null;

  const nota = Number(valor);
  if (!Number.isFinite(nota)) return null;
  if (nota < 1 || nota > 5) return null;
  if (nota * 2 !== Math.round(nota * 2)) return null;
  return nota;
}

// Converte o :id da URL em número inteiro positivo. Devolve null se não for um.
export function lerIDDaRota(valor: unknown): number | null {
  return typeof valor === 'string' && /^[1-9]\d{0,14}$/.test(valor) ? Number(valor) : null;
}

// Deixa o texto em minúsculas e sem acentos, para a busca por nome ignorar
// maiúsculas e acentos ("cafe" encontra "Café").
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Recebe uma lista de pares [deuErro, mensagem] e devolve a mensagem do
// primeiro que falhou (ou null se está tudo certo).
export function primeiroErro(regras: Array<[boolean, string]>): string | null {
  const falha = regras.find(([deuErro]) => deuErro);
  return falha ? falha[1] : null;
}
