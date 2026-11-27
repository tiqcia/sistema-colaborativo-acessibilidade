// Controller de Estabelecimento: recebe a requisição, confere os dados,
// chama o model e devolve o JSON EXATAMENTE no formato que o frontend já usa
// (tipos em tipos/api.ts).
//
// Os handlers são síncronos (o banco é síncrono) e devolvem "void": respondem
// com res.json(...) e pronto. Se algo lançar um erro, o Express o encaminha
// para o tratadorDeErros.
import type { Request, Response } from 'express';
import {
  buscarEstabelecimentoPorID,
  criarEstabelecimento,
  listarEstabelecimentos,
} from '../models/estabelecimentoModel.ts';
import { USUARIO_ANONIMO_ID } from '../config/constantes.ts';
import type { LinhaEstabelecimentoDetalhe, LinhaEstabelecimentoResumo } from '../tipos/banco.ts';
import type { EstabelecimentoDetalhe, EstabelecimentoResumo, RespostaCriado } from '../tipos/api.ts';
import { responderErro } from '../utils/resposta.ts';
import { LIMITES, lerIDDaRota, lerTexto, normalizarTexto, primeiroErro } from '../utils/validacao.ts';

// --- formatos de resposta (os nomes dos campos são os do frontend) ---

// Lista de busca: o frontend usa id, nome, descricao e nota.
function paraResumo(linha: LinhaEstabelecimentoResumo): EstabelecimentoResumo {
  return {
    id: String(linha.estabelecimentoID), // o frontend espera id como texto
    nome: linha.nome,
    descricao: linha.descricao ?? '',
    nota: linha.notaMedia,
  };
}

// Tela de detalhes. imagemUrl fica null até o recurso de fotos ser criado.
function paraDetalhe(linha: LinhaEstabelecimentoDetalhe): EstabelecimentoDetalhe {
  return {
    id: String(linha.estabelecimentoID),
    nome: linha.nome,
    categoria: linha.categoria,
    endereco: linha.endereco,
    descricao: linha.descricao ?? '',
    notaMedia: linha.notaMedia,
    totalAvaliacoes: linha.totalAvaliacoes,
    imagemUrl: null,
  };
}

// --- handlers ---

// GET /estabelecimentos?busca=texto
export function listar(req: Request, res: Response): void {
  const busca = typeof req.query.busca === 'string' ? normalizarTexto(req.query.busca.trim()) : '';

  const lista = listarEstabelecimentos()
    .filter((linha) => !busca || normalizarTexto(linha.nome).includes(busca))
    .map(paraResumo);

  res.json(lista);
}

// GET /estabelecimentos/:id
export function detalhar(req: Request, res: Response): void {
  const estabelecimentoID = lerIDDaRota(req.params.id);
  const linha = estabelecimentoID === null ? undefined : buscarEstabelecimentoPorID(estabelecimentoID);

  if (!linha) {
    responderErro(res, 404, 'Estabelecimento não encontrado.');
    return;
  }
  res.json(paraDetalhe(linha));
}

// POST /estabelecimentos
// O app envia os campos nome, endereco, categoria e (opcional) observacoes.
// Uma foto ("imagem"), se vier, é aceita mas ignorada por enquanto.
export function criar(req: Request, res: Response): void {
  const corpo: Record<string, unknown> = req.body ?? {}; // no Express 5, req.body pode ser undefined
  const nome = lerTexto(corpo.nome);
  const endereco = lerTexto(corpo.endereco);
  const categoria = lerTexto(corpo.categoria);
  const descricao = lerTexto(corpo.observacoes ?? corpo.descricao);

  const erro = primeiroErro([
    [!nome, 'Informe o nome do estabelecimento.'],
    [!endereco, 'Informe o endereço do estabelecimento.'],
    [!categoria, 'Selecione uma categoria.'],
    [nome.length > LIMITES.nome, `O nome pode ter no máximo ${LIMITES.nome} caracteres.`],
    [endereco.length > LIMITES.endereco, `O endereço pode ter no máximo ${LIMITES.endereco} caracteres.`],
    [categoria.length > LIMITES.categoria, `A categoria pode ter no máximo ${LIMITES.categoria} caracteres.`],
    [descricao.length > LIMITES.descricao, `A descrição pode ter no máximo ${LIMITES.descricao} caracteres.`],
  ]);
  if (erro) {
    responderErro(res, 400, erro);
    return;
  }

  const estabelecimentoID = criarEstabelecimento({
    usuarioID: USUARIO_ANONIMO_ID, // quando houver login, trocar pelo usuário logado
    nome,
    endereco,
    categoria,
    descricao: descricao || null, // texto vazio vira "sem descrição" (NULL)
  });

  const resposta: RespostaCriado = { id: String(estabelecimentoID) };
  res.status(201).json(resposta);
}
