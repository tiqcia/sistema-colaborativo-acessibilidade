// Liga cada endereço (URL + método) ao controller correspondente.
// O prefixo "/estabelecimentos" é definido em app.ts.
import express from 'express';
import * as avaliacaoController from '../controllers/avaliacaoController.ts';
import * as estabelecimentoController from '../controllers/estabelecimentoController.ts';
import { lerMultipart } from '../middlewares/lerMultipart.ts';

export const estabelecimentoRoutes = express.Router();

estabelecimentoRoutes.get('/', estabelecimentoController.listar);                           // GET  /estabelecimentos?busca=
estabelecimentoRoutes.post('/', lerMultipart, estabelecimentoController.criar);             // POST /estabelecimentos
// ATENÇÃO: "/mapa" precisa vir ANTES de "/:id". Se viesse depois, o Express acharia que
// "mapa" é um id e responderia 404.
estabelecimentoRoutes.get('/mapa', estabelecimentoController.listarNoMapa);                 // GET  /estabelecimentos/mapa
estabelecimentoRoutes.get('/:id', estabelecimentoController.detalhar);                      // GET  /estabelecimentos/1
estabelecimentoRoutes.put('/:id/localizacao', estabelecimentoController.definirLocalizacao); // PUT  /estabelecimentos/1/localizacao
estabelecimentoRoutes.get('/:id/avaliacoes', avaliacaoController.listarDoEstabelecimento);  // GET  /estabelecimentos/1/avaliacoes
estabelecimentoRoutes.post('/:id/avaliacoes', avaliacaoController.criar);                   // POST /estabelecimentos/1/avaliacoes
