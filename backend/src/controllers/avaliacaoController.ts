// Controller de Avaliacao. Mesmo papel do controller de Estabelecimento.
import type { Request, Response } from 'express';
import { existeEstabelecimento } from '../models/estabelecimentoModel.ts';
import { criarAvaliacao, listarAvaliacoesDoEstabelecimento } from '../models/avaliacaoModel.ts';
import { USUARIO_ANONIMO_ID } from '../config/constantes.ts';
import type { LinhaAvaliacao } from '../tipos/banco.ts';
import type { AvaliacaoResposta, RespostaCriado } from '../tipos/api.ts';
import { responderErro } from '../utils/resposta.ts';
import { tempoRelativo } from '../utils/tempoRelativo.ts';
import { LIMITES, lerIDDaRota, lerNota, lerTexto, primeiroErro } from '../utils/validacao.ts';

// Formato que o card de avaliação do frontend usa.
function paraAvaliacao(linha: LinhaAvaliacao): AvaliacaoResposta {
  return {
    id: String(linha.avaliacaoID),
    autor: linha.autor,
    data: tempoRelativo(linha.criadoEm), // ex.: "há 2 dias"
    nota: linha.qtdEstrelas,
    titulo: linha.titulo ?? undefined, // sem título: o campo nem é enviado
    comentario: linha.comentario ?? '',
  };
}

// Devolve o ID da URL se for válido E existir no banco; senão responde 404 e devolve null.
function exigirEstabelecimento(req: Request, res: Response): number | null {
  const estabelecimentoID = lerIDDaRota(req.params.id);
  if (estabelecimentoID === null || !existeEstabelecimento(estabelecimentoID)) {
    responderErro(res, 404, 'Estabelecimento não encontrado.');
    return null;
  }
  return estabelecimentoID;
}

// GET /estabelecimentos/:id/avaliacoes
export function listarDoEstabelecimento(req: Request, res: Response): void {
  const estabelecimentoID = exigirEstabelecimento(req, res);
  if (estabelecimentoID === null) return;

  res.json(listarAvaliacoesDoEstabelecimento(estabelecimentoID).map(paraAvaliacao));
}

// POST /estabelecimentos/:id/avaliacoes   corpo JSON: { nota, titulo?, comentario }
// (o app também manda "estabelecimentoId" no corpo; ignoramos, vale o da URL)
export function criar(req: Request, res: Response): void {
  const estabelecimentoID = exigirEstabelecimento(req, res);
  if (estabelecimentoID === null) return;

  const corpo: Record<string, unknown> = req.body ?? {};
  const qtdEstrelas = lerNota(corpo.nota);
  const titulo = lerTexto(corpo.titulo);
  const comentario = lerTexto(corpo.comentario);

  // Conferimos a nota primeiro e separadamente: assim o TypeScript passa a saber
  // que, daqui para a frente, qtdEstrelas é um número (e não null).
  if (qtdEstrelas === null) {
    responderErro(res, 400, 'Selecione uma nota de 1 a 5 estrelas.');
    return;
  }

  const erro = primeiroErro([
    [!comentario, 'Escreva um relato sobre a acessibilidade do local.'],
    [titulo.length > LIMITES.titulo, `O título pode ter no máximo ${LIMITES.titulo} caracteres.`],
    [comentario.length > LIMITES.comentario, `O relato pode ter no máximo ${LIMITES.comentario} caracteres.`],
  ]);
  if (erro) {
    responderErro(res, 400, erro);
    return;
  }

  const avaliacaoID = criarAvaliacao({
    usuarioID: USUARIO_ANONIMO_ID, // quando houver login, trocar pelo usuário logado
    estabelecimentoID,
    qtdEstrelas,
    titulo: titulo || null,
    comentario,
  });

  const resposta: RespostaCriado = { id: String(avaliacaoID) };
  res.status(201).json(resposta);
}
