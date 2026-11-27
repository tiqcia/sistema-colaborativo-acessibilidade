// Liga cada endereço (URL + método) ao controller correspondente.
// O prefixo "/estabelecimentos" é definido em app.ts.
import express from 'express';
import * as avaliacaoController from '../controllers/avaliacaoController.ts';
import * as estabelecimentoController from '../controllers/estabelecimentoController.ts';
import { lerMultipart } from '../middlewares/lerMultipart.ts';

export const estabelecimentoRoutes = express.Router();

estabelecimentoRoutes.get('/mapa', estabelecimentoController.listarNoMapa);
estabelecimentoRoutes.patch('/:id/localizacao', estabelecimentoController.definirLocalizacao);
estabelecimentoRoutes.get('/', estabelecimentoController.listar);                           // GET  /estabelecimentos?busca=
estabelecimentoRoutes.post('/', lerMultipart, estabelecimentoController.criar);             // POST /estabelecimentos
estabelecimentoRoutes.get('/:id', estabelecimentoController.detalhar);                      // GET  /estabelecimentos/1
estabelecimentoRoutes.get('/:id/avaliacoes', avaliacaoController.listarDoEstabelecimento);  // GET  /estabelecimentos/1/avaliacoes
estabelecimentoRoutes.post('/:id/avaliacoes', avaliacaoController.criar);                   // POST /estabelecimentos/1/avaliacoes
