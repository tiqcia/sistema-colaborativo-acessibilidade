// Monta a aplicação Express (sem ligar o servidor; isso é feito em servidor.ts).
import cors from 'cors';
import express from 'express';
import { rotaNaoEncontrada, tratadorDeErros } from './middlewares/tratadorDeErros.ts';
import { estabelecimentoRoutes } from './routes/estabelecimentoRoutes.ts';

const app = express();

app.use(cors());                           // necessário se o app rodar no navegador (Expo web)
app.use(express.json({ limit: '100kb' })); // lê corpos em JSON (ex.: nova avaliação)

// Para testar rapidamente se o servidor está acessível (inclusive pelo navegador do celular)
app.get('/saude', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/estabelecimentos', estabelecimentoRoutes);

app.use(rotaNaoEncontrada); // sempre depois das rotas
app.use(tratadorDeErros);   // sempre por último

export default app;
