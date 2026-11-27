// Formato do JSON que a API ENVIA ao app. Os nomes dos campos são os que o
// frontend já usa. (Este arquivo pode ser copiado para o frontend para tipar
// as respostas do fetch, se o responsável pelo frontend quiser.)

// GET /estabelecimentos
export interface EstabelecimentoResumo {
  id: string;
  nome: string;
  descricao: string;
  nota: number;
}

// GET /estabelecimentos/:id
export interface EstabelecimentoDetalhe {
  id: string;
  nome: string;
  categoria: string;
  endereco: string;
  descricao: string;
  notaMedia: number;
  totalAvaliacoes: number;
  imagemUrl: string | null; // sempre null até as fotos serem implementadas
}

// GET /estabelecimentos/:id/avaliacoes
export interface AvaliacaoResposta {
  id: string;
  autor: string;
  data: string; // já formatada, ex.: "há 2 dias"
  nota: number;
  titulo?: string; // ausente quando a avaliação não tem título
  comentario: string;
}

// POST /estabelecimentos e POST /estabelecimentos/:id/avaliacoes
export interface RespostaCriado {
  id: string;
}

// Qualquer erro
export interface RespostaErro {
  erro: string;
}
