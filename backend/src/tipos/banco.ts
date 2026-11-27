// Formato das linhas que o banco devolve (os nomes são os das colunas) e dos
// dados que os models recebem para inserir.

export interface LinhaEstabelecimentoResumo {
  estabelecimentoID: number;
  nome: string;
  descricao: string | null;
  notaMedia: number;
}

export interface LinhaEstabelecimentoDetalhe {
  estabelecimentoID: number;
  nome: string;
  categoria: string;
  endereco: string;
  descricao: string | null;
  notaMedia: number;
  totalAvaliacoes: number;
}

export interface LinhaAvaliacao {
  avaliacaoID: number;
  autor: string; // nome do Usuario que fez a avaliação
  qtdEstrelas: number;
  titulo: string | null;
  comentario: string | null;
  criadoEm: string; // "AAAA-MM-DD HH:MM:SS", em UTC
}

export interface NovoEstabelecimento {
  usuarioID: number;
  nome: string;
  endereco: string;
  categoria: string;
  descricao: string | null;
}

export interface NovaAvaliacao {
  usuarioID: number;
  estabelecimentoID: number;
  qtdEstrelas: number;
  titulo: string | null;
  comentario: string;
}
