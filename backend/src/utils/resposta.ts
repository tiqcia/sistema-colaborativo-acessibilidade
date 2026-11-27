// Atalho para responder erros sempre no mesmo formato: { erro: "mensagem" }.
import type { Response } from 'express';
import type { RespostaErro } from '../tipos/api.ts';

export function responderErro(res: Response, codigo: number, mensagem: string): void {
  const corpo: RespostaErro = { erro: mensagem };
  res.status(codigo).json(corpo);
}
