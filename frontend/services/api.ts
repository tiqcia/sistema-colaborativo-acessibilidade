// Comunicação com o backend. As telas falam com o servidor SOMENTE por aqui.
//
// O endereço do servidor vem da variável EXPO_PUBLIC_API_URL, definida no arquivo
// ".env.local" (veja ".env.example"). O Expo só enxerga a variável se ela for escrita
// exatamente como process.env.EXPO_PUBLIC_API_URL (sem colchetes e sem desestruturar).
import type { Avaliacao } from '../components/avaliacaoCard';
import type { EstabelecimentoResumo } from '../components/estabelecimentoCard';

// Formato da tela de detalhes (o mesmo que o backend envia em GET /estabelecimentos/:id)
export interface EstabelecimentoDetalhe {
  id: string;
  nome: string;
  categoria: string;
  endereco: string;
  descricao: string;
  notaMedia: number;
  totalAvaliacoes: number;
  imagemUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

// Dados enviados ao criar uma avaliação
export interface EstabelecimentoMapa { id: string; nome: string; endereco: string; categoria: string; latitude: number | null; longitude: number | null; }

export interface NovaAvaliacao {
  nota: number;
  titulo?: string;
  comentario: string;
}

interface OpcoesRequisicao {
  method?: 'GET' | 'POST';
  body?: FormData | string;
  headers?: Record<string, string>;
}

// Sem resposta em 10 segundos, desistimos (senão o app ficaria "carregando" por muito tempo
// quando o notebook está desligado ou em outra rede).
const TEMPO_LIMITE_MS = 10000;

function enderecoDoServidor(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      'O endereço do servidor não está configurado. Crie o arquivo .env.local na pasta frontend com a linha EXPO_PUBLIC_API_URL=http://IP-DO-NOTEBOOK:3000 e reinicie o Expo.'
    );
  }
  return url.replace(/\/+$/, ''); // tira barras no final
}

// Transforma os erros técnicos do fetch em mensagens que o usuário entende.
function traduzirErro(erro: unknown): Error {
  if (erro instanceof Error) {
    if (erro.name === 'AbortError') {
      return new Error(
        'O servidor demorou demais para responder. Confira se o notebook e o celular estão na mesma rede.'
      );
    }
    if (erro instanceof TypeError) {
      return new Error(
        'Não foi possível conectar ao servidor. Confira se o backend está ligado e se o notebook e o celular estão na mesma rede.'
      );
    }
    return erro; // erro com mensagem vinda do próprio servidor
  }
  return new Error('Ocorreu um erro inesperado.');
}

async function requisicao<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const base = enderecoDoServidor();
  const controlador = new AbortController();
  const cronometro = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(`${base}${caminho}`, {
      method: opcoes.method ?? 'GET',
      body: opcoes.body,
      headers: { Accept: 'application/json', ...opcoes.headers },
      signal: controlador.signal,
    });

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      // O backend sempre responde erros como { erro: "mensagem" }
      throw new Error((dados && dados.erro) || `O servidor respondeu com erro ${resposta.status}.`);
    }
    if (dados === null) {
      throw new Error('O servidor enviou uma resposta inválida.');
    }
    return dados as T;
  } catch (erro) {
    throw traduzirErro(erro);
  } finally {
    clearTimeout(cronometro);
  }
}

// Texto pronto para mostrar em um alerta ou na tela.
export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.';
}

export const api = {
  // Lista de estabelecimentos (tela de busca)
  listarEstabelecimentos: () =>
    requisicao<EstabelecimentoResumo[]>('/estabelecimentos'),

  listarNoMapa: () => requisicao<EstabelecimentoMapa[]>('/estabelecimentos/mapa'),
  definirLocalizacao: (id: string, latitude: number, longitude: number) =>
    requisicao<{ status: string }>(`/estabelecimentos/${encodeURIComponent(id)}/localizacao`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    }),

  // Detalhes de um estabelecimento
  buscarEstabelecimento: (id: string) =>
    requisicao<EstabelecimentoDetalhe>(`/estabelecimentos/${encodeURIComponent(id)}`),

  // Avaliações de um estabelecimento
  listarAvaliacoes: (id: string) =>
    requisicao<Avaliacao[]>(`/estabelecimentos/${encodeURIComponent(id)}/avaliacoes`),

  // Cadastro de estabelecimento. Recebe o FormData que a tela já monta.
  // Não definimos Content-Type aqui: o fetch coloca o correto (com o "boundary").
  criarEstabelecimento: (formData: FormData) =>
    requisicao<{ id: string }>('/estabelecimentos', { method: 'POST', body: formData }),

  // Nova avaliação (o id do estabelecimento vai na URL)
  criarAvaliacao: (id: string, dados: NovaAvaliacao) =>
    requisicao<{ id: string }>(`/estabelecimentos/${encodeURIComponent(id)}/avaliacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    }),
};
