// Respostas de erro padronizadas: sempre JSON no formato { erro: "mensagem" }.
import type { NextFunction, Request, Response } from 'express';
import { responderErro } from '../utils/resposta.ts';

// Os erros do express.json() e do multer trazem estes campos para identificá-los.
interface ErroConhecido {
  type?: string;
  name?: string;
}

// Usada quando nenhuma rota combina com o endereço pedido.
export function rotaNaoEncontrada(_req: Request, res: Response): void {
  responderErro(res, 404, 'Rota não encontrada.');
}

// O Express reconhece um tratador de erros pelos 4 parâmetros (erro, req, res, next).
// Por isso os 4 precisam existir, mesmo os que não usamos.
export function tratadorDeErros(erro: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(erro);
    return;
  }

  const { type, name } = (erro ?? {}) as ErroConhecido;

  if (type === 'entity.parse.failed') {
    responderErro(res, 400, 'O corpo da requisição não é um JSON válido.');
    return;
  }
  if (type === 'entity.too.large') {
    responderErro(res, 413, 'Os dados enviados são grandes demais.');
    return;
  }
  if (name === 'MulterError') {
    responderErro(res, 400, 'Não foi possível ler os dados enviados (arquivo grande demais ou campos demais).');
    return;
  }

  console.error(erro); // fica no terminal do servidor, para vocês investigarem
  responderErro(res, 500, 'Erro interno do servidor.');
}
