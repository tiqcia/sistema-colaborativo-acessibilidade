// Testes automáticos. Rode com:  npm test
// Usam um banco temporário na memória (não mexem no seu arquivo .db) e chamam
// os controllers diretamente, sem precisar ligar o servidor.
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

// O banco lê CAMINHO_BANCO ao ser carregado. Como os "import" do topo sempre
// rodam primeiro, os módulos que usam o banco são carregados com import()
// DEPOIS de definirmos a variável.
process.env.CAMINHO_BANCO = ':memory:';

const { db, garantirColuna } = await import('../src/config/banco.ts');
const { popular } = await import('../src/config/popularBanco.ts');
const estabelecimentoController = await import('../src/controllers/estabelecimentoController.ts');
const avaliacaoController = await import('../src/controllers/avaliacaoController.ts');
const { tratadorDeErros, rotaNaoEncontrada } = await import('../src/middlewares/tratadorDeErros.ts');
const { tempoRelativo } = await import('../src/utils/tempoRelativo.ts');
const { lerNota, lerIDDaRota, lerLatitude, lerLongitude } = await import('../src/utils/validacao.ts');

type Handler = (req: Request, res: Response) => void;

interface Resposta {
  codigo: number;
  // "any" só nos testes, para podermos olhar dentro do JSON sem converter tudo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  corpo: any;
}

// Chama um handler com uma requisição e uma resposta "de mentira".
function chamar(
  handler: Handler,
  { params = {}, query = {}, body }: { params?: Record<string, string>; query?: Record<string, unknown>; body?: unknown } = {},
): Resposta {
  const resposta: Resposta = { codigo: 200, corpo: undefined };
  const res = {
    status(codigo: number) { resposta.codigo = codigo; return res; },
    json(corpo: unknown) { resposta.corpo = corpo; return res; },
  };
  handler({ params, query, body } as unknown as Request, res as unknown as Response);
  return resposta;
}

test('banco: o usuário anônimo existe e os dados de exemplo entram uma vez só', () => {
  const anonimo = db.prepare('SELECT nome, email FROM Usuario WHERE usuarioID = 1').get() as unknown as { nome: string; email: string };
  assert.equal(anonimo.nome, 'Usuário Anônimo');
  assert.equal(anonimo.email, 'anonimo@example.com');

  assert.equal(popular(), true);
  assert.equal(popular(), false); // segunda vez: não duplica
});

test('GET /estabelecimentos devolve o formato mínimo da lista', () => {
  const res = chamar(estabelecimentoController.listar);
  assert.equal(res.codigo, 200);
  assert.equal(res.corpo.length, 1);
  assert.deepEqual(res.corpo[0], {
    id: '1',
    nome: "McDonald's",
    descricao: 'Rede de fast-food tradicional conhecida por ter ótimos hambúrgueres e batatas fritas.',
    nota: 4.5, // média de 4 e 5
  });
});

test('GET /estabelecimentos/:id devolve o formato de detalhes', () => {
  const res = chamar(estabelecimentoController.detalhar, { params: { id: '1' } });
  assert.equal(res.codigo, 200);
  assert.deepEqual(res.corpo, {
    id: '1',
    nome: "McDonald's",
    categoria: 'Lanchonete',
    endereco: 'R. Miguel Couto, 67 - Jardim Shangri-Lá',
    descricao: 'Rede de fast-food tradicional conhecida por ter ótimos hambúrgueres e batatas fritas.',
    notaMedia: 4.5,
    totalAvaliacoes: 2,
    imagemUrl: null,
    latitude: null, // os dados de exemplo ainda não têm localização no mapa
    longitude: null,
  });
});

test('GET /estabelecimentos/:id com id inexistente ou inválido dá 404', () => {
  assert.equal(chamar(estabelecimentoController.detalhar, { params: { id: '999' } }).codigo, 404);
  assert.equal(chamar(estabelecimentoController.detalhar, { params: { id: 'abc' } }).codigo, 404);
  assert.equal(chamar(estabelecimentoController.detalhar, { params: { id: '1; DROP TABLE Usuario' } }).codigo, 404);
});

test('POST /estabelecimentos cria (como vem do FormData: tudo texto) e já aparece na lista', () => {
  const res = chamar(estabelecimentoController.criar, {
    body: { nome: '  Café Central ', endereco: 'Rua A, 10', categoria: 'Cafeteria', observacoes: '' },
  });
  assert.equal(res.codigo, 201);
  assert.equal(typeof res.corpo.id, 'string');

  const detalhe = chamar(estabelecimentoController.detalhar, { params: { id: res.corpo.id } });
  assert.equal(detalhe.corpo.nome, 'Café Central'); // espaços das pontas removidos
  assert.equal(detalhe.corpo.descricao, '');
  assert.equal(detalhe.corpo.notaMedia, 0);          // sem avaliações: 0, nunca null
  assert.equal(detalhe.corpo.totalAvaliacoes, 0);
});

test('POST /estabelecimentos recusa dados inválidos', () => {
  const casos: unknown[] = [
    undefined, // corpo ausente (Express 5)
    {},
    { nome: 'X', endereco: 'Y' },                                  // falta categoria
    { nome: '   ', endereco: 'Y', categoria: 'Loja' },            // nome só com espaços
    { nome: 123, endereco: 'Y', categoria: 'Loja' },              // tipo errado
    { nome: 'a'.repeat(101), endereco: 'Y', categoria: 'Loja' },  // grande demais
  ];
  for (const body of casos) {
    const res = chamar(estabelecimentoController.criar, { body });
    assert.equal(res.codigo, 400, JSON.stringify(body));
    assert.equal(typeof res.corpo.erro, 'string');
  }
});

test('busca por nome ignora maiúsculas e acentos', () => {
  const achar = (busca: string): string[] =>
    chamar(estabelecimentoController.listar, { query: { busca } }).corpo.map((e: { nome: string }) => e.nome);
  assert.deepEqual(achar('cafe'), ['Café Central']);
  assert.deepEqual(achar('CAFÉ'), ['Café Central']);
  assert.deepEqual(achar('mcdonald'), ["McDonald's"]);
  assert.deepEqual(achar('nada'), []);
  assert.equal(achar('').length, 2);
});

test('GET /estabelecimentos/:id/avaliacoes devolve o formato do card, da mais nova para a mais antiga', () => {
  const res = chamar(avaliacaoController.listarDoEstabelecimento, { params: { id: '1' } });
  assert.equal(res.codigo, 200);
  assert.equal(res.corpo.length, 2);
  assert.deepEqual(res.corpo[0], {
    id: '1',
    autor: 'Fulano',
    data: 'há 2 dias',
    nota: 4,
    titulo: 'Entrada ok, banheiro não',
    comentario: res.corpo[0].comentario,
  });
  assert.equal(res.corpo[1].autor, 'Usuário Anônimo');
  assert.equal(res.corpo[1].data, 'há 1 semana');
  assert.equal(chamar(avaliacaoController.listarDoEstabelecimento, { params: { id: '999' } }).codigo, 404);
});

test('POST /estabelecimentos/:id/avaliacoes aceita meias estrelas e atualiza a média', () => {
  const res = chamar(avaliacaoController.criar, {
    params: { id: '1' },
    body: { estabelecimentoId: '1', nota: 3.5, comentario: ' Rampa íngreme. ' }, // sem título
  });
  assert.equal(res.codigo, 201);

  const lista: Array<{ id: string; nota: number; comentario: string; autor: string; data: string }> =
    chamar(avaliacaoController.listarDoEstabelecimento, { params: { id: '1' } }).corpo;
  const nova = lista.find((a) => a.id === res.corpo.id);
  assert.ok(nova);
  assert.equal(nova.nota, 3.5);
  assert.equal(nova.comentario, 'Rampa íngreme.');
  assert.equal(nova.autor, 'Usuário Anônimo');
  assert.equal(nova.data, 'agora mesmo');
  // sem título, o campo some do JSON que realmente é enviado ao app
  assert.equal('titulo' in JSON.parse(JSON.stringify(nova)), false);

  const detalhe = chamar(estabelecimentoController.detalhar, { params: { id: '1' } }).corpo;
  assert.equal(detalhe.totalAvaliacoes, 3);
  assert.equal(detalhe.notaMedia, 4.2); // (4 + 5 + 3,5) / 3 = 4,1666... arredondado
});

test('POST avaliacoes recusa dados inválidos', () => {
  const casos: unknown[] = [
    { nota: 0, comentario: 'x' },
    { nota: 6, comentario: 'x' },
    { nota: 3.7, comentario: 'x' },       // não é múltiplo de 0,5
    { nota: 'abc', comentario: 'x' },
    { nota: true, comentario: 'x' },
    { nota: '', comentario: 'x' },
    { comentario: 'x' },                  // sem nota
    { nota: 4 },                          // sem comentário
    { nota: 4, comentario: '   ' },
    { nota: 4, comentario: 'x', titulo: 'a'.repeat(81) },
  ];
  for (const body of casos) {
    const res = chamar(avaliacaoController.criar, { params: { id: '1' }, body });
    assert.equal(res.codigo, 400, JSON.stringify(body));
  }
  assert.equal(chamar(avaliacaoController.criar, { params: { id: '999' }, body: { nota: 4, comentario: 'x' } }).codigo, 404);
  assert.equal(chamar(avaliacaoController.criar, { params: { id: '1' }, body: undefined }).codigo, 400);
});

test('POST /estabelecimentos aceita localização (texto, como vem do FormData) e a devolve nos detalhes', () => {
  const res = chamar(estabelecimentoController.criar, {
    body: { nome: 'Padaria Sol', endereco: 'Rua B, 20', categoria: 'Loja', latitude: '-23.3105', longitude: '-51.1628' },
  });
  assert.equal(res.codigo, 201);

  const detalhe = chamar(estabelecimentoController.detalhar, { params: { id: res.corpo.id } }).corpo;
  assert.equal(detalhe.latitude, -23.3105); // texto virou número
  assert.equal(detalhe.longitude, -51.1628);
});

test('POST /estabelecimentos recusa localização incompleta ou fora dos limites', () => {
  const base = { nome: 'Z', endereco: 'Y', categoria: 'Loja' };
  const casos: unknown[] = [
    { ...base, latitude: '-23.3' },                       // falta a longitude
    { ...base, longitude: '-51.1' },                      // falta a latitude
    { ...base, latitude: '91', longitude: '0' },          // latitude passa de 90
    { ...base, latitude: '0', longitude: '-181' },        // longitude passa de 180
    { ...base, latitude: 'abc', longitude: '0' },         // não é número
    { ...base, latitude: true, longitude: 0 },            // tipo errado
  ];
  for (const body of casos) {
    const res = chamar(estabelecimentoController.criar, { body });
    assert.equal(res.codigo, 400, JSON.stringify(body));
  }
});

test('GET /estabelecimentos/mapa devolve só quem tem localização, com nota e total de avaliações', () => {
  const res = chamar(estabelecimentoController.listarNoMapa);
  assert.equal(res.codigo, 200);
  // Dos locais criados até aqui, só a "Padaria Sol" tem localização.
  assert.equal(res.corpo.length, 1);
  assert.deepEqual(res.corpo[0], {
    id: res.corpo[0].id,
    nome: 'Padaria Sol',
    categoria: 'Loja',
    latitude: -23.3105,
    longitude: -51.1628,
    nota: 0,              // ainda sem avaliações: 0, nunca null
    totalAvaliacoes: 0,
  });
});

test('PUT /estabelecimentos/:id/localizacao marca um local antigo no mapa', () => {
  // O McDonald's (id 1) veio sem localização
  const antes = chamar(estabelecimentoController.listarNoMapa).corpo.map((p: { id: string }) => p.id);
  assert.equal(antes.includes('1'), false);

  const res = chamar(estabelecimentoController.definirLocalizacao, {
    params: { id: '1' },
    body: { latitude: -23.3236, longitude: '-51.1853' }, // número e texto são aceitos
  });
  assert.equal(res.codigo, 200);
  assert.deepEqual(res.corpo, { id: '1', latitude: -23.3236, longitude: -51.1853 });

  // agora aparece no mapa, já com a nota média das avaliações que ele tinha
  const ponto = chamar(estabelecimentoController.listarNoMapa).corpo.find((p: { id: string }) => p.id === '1');
  assert.ok(ponto);
  assert.equal(ponto.nota, 4.2);          // (4 + 5 + 3,5) / 3, das avaliações dos testes anteriores
  assert.equal(ponto.totalAvaliacoes, 3);

  // corrigir a localização também funciona
  chamar(estabelecimentoController.definirLocalizacao, { params: { id: '1' }, body: { latitude: 10, longitude: 20 } });
  assert.equal(chamar(estabelecimentoController.detalhar, { params: { id: '1' } }).corpo.latitude, 10);
});

test('PUT localizacao recusa dados inválidos e id inexistente', () => {
  const invalidos: unknown[] = [undefined, {}, { latitude: 1 }, { longitude: 1 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: '', longitude: '' }];
  for (const body of invalidos) {
    const res = chamar(estabelecimentoController.definirLocalizacao, { params: { id: '1' }, body });
    assert.equal(res.codigo, 400, JSON.stringify(body));
  }
  assert.equal(chamar(estabelecimentoController.definirLocalizacao, { params: { id: '999' }, body: { latitude: 0, longitude: 0 } }).codigo, 404);
  assert.equal(chamar(estabelecimentoController.definirLocalizacao, { params: { id: 'abc' }, body: { latitude: 0, longitude: 0 } }).codigo, 404);
});

test('validação: latitude e longitude', () => {
  assert.equal(lerLatitude(-23.31), -23.31);
  assert.equal(lerLatitude('90'), 90);
  assert.equal(lerLatitude(' -90 '), -90);
  assert.equal(lerLongitude(180), 180);
  assert.equal(lerLongitude('0'), 0); // zero é uma coordenada válida (não pode virar "vazio")
  for (const entrada of [91, -91, '', '  ', 'abc', NaN, Infinity, null, undefined, true, [], {}]) {
    assert.equal(lerLatitude(entrada), null, String(entrada));
  }
  assert.equal(lerLongitude(181), null);
  assert.equal(lerLongitude(-181), null);
});

test('o banco recusa coordenadas fora dos limites (rede de segurança)', () => {
  const gravar = (lat: number, lng: number) => db.prepare(
    'UPDATE Estabelecimento SET latitude = ?, longitude = ? WHERE estabelecimentoID = 1'
  ).run(lat, lng);
  assert.throws(() => gravar(95, 0));
  assert.throws(() => gravar(0, 200));
  assert.doesNotThrow(() => gravar(-23.3, -51.1));
});

test('garantirColuna acrescenta a coluna sem perder dados e pode rodar de novo', () => {
  // Simula uma tabela "antiga", sem a coluna nova, já com uma linha dentro
  db.exec('CREATE TABLE TesteMigracao (id INTEGER PRIMARY KEY, nome TEXT)');
  db.prepare("INSERT INTO TesteMigracao (nome) VALUES ('antigo')").run();

  const colunas = () => (db.prepare('PRAGMA table_info(TesteMigracao)').all() as unknown as Array<{ name: string }>).map((c) => c.name);
  assert.deepEqual(colunas(), ['id', 'nome']);

  garantirColuna('TesteMigracao', 'extra', 'REAL');
  garantirColuna('TesteMigracao', 'extra', 'REAL'); // segunda vez: não dá erro e não duplica
  assert.deepEqual(colunas(), ['id', 'nome', 'extra']);

  const linha = db.prepare('SELECT nome, extra FROM TesteMigracao').get() as unknown as { nome: string; extra: number | null };
  assert.equal(linha.nome, 'antigo'); // o dado antigo continua lá
  assert.equal(linha.extra, null);    // e a coluna nova começa vazia

  db.exec('DROP TABLE TesteMigracao');
});

test('o próprio banco recusa dados que violam as regras (rede de segurança)', () => {
  const inserirNota = (nota: number) => db.prepare(
    'INSERT INTO Avaliacao (usuarioID, estabelecimentoID, qtdEstrelas) VALUES (1, 1, ?)'
  ).run(nota);
  assert.throws(() => inserirNota(3.7));
  assert.throws(() => inserirNota(0));
  assert.throws(() => inserirNota(5.5));
  assert.doesNotThrow(() => inserirNota(1.5));

  // chave estrangeira: estabelecimento inexistente
  assert.throws(() => db.prepare(
    'INSERT INTO Avaliacao (usuarioID, estabelecimentoID, qtdEstrelas) VALUES (1, 999, 4)').run());
  // e-mail repetido (ignorando maiúsculas)
  assert.throws(() => db.prepare("INSERT INTO Usuario (nome, email) VALUES ('Outro', 'ANONIMO@example.com')").run());
  // assistencias: só JSON de lista
  assert.throws(() => db.prepare("INSERT INTO Usuario (nome, email, assistencias) VALUES ('T', 't1@example.com', 'texto solto')").run());
  assert.throws(() => db.prepare("INSERT INTO Usuario (nome, email, assistencias) VALUES ('T', 't2@example.com', '{\"a\":1}')").run());
  assert.doesNotThrow(() => db.prepare("INSERT INTO Usuario (nome, email, assistencias) VALUES ('T', 't3@example.com', '[\"a\"]')").run());
});

test('apagar um estabelecimento apaga as avaliações dele (CASCADE)', () => {
  db.prepare('DELETE FROM Estabelecimento WHERE estabelecimentoID = 1').run();
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM Avaliacao WHERE estabelecimentoID = 1').get() as unknown as { total: number };
  assert.equal(total, 0);
});

test('tratador de erros: o Express exige 4 parâmetros e as respostas saem padronizadas', () => {
  assert.equal(tratadorDeErros.length, 4); // se virar 3, o Express deixa de tratá-lo como tratador de erros

  const executar = (erro: unknown): Resposta => {
    const resposta: Resposta = { codigo: 200, corpo: undefined };
    const res = {
      headersSent: false,
      status(codigo: number) { resposta.codigo = codigo; return res; },
      json(corpo: unknown) { resposta.corpo = corpo; return res; },
    };
    const silenciar = console.error;
    console.error = () => {}; // o caso do erro 500 imprime no terminal; aqui não precisamos ver
    try {
      tratadorDeErros(erro, {} as Request, res as unknown as Response, () => {});
    } finally {
      console.error = silenciar;
    }
    return resposta;
  };

  assert.equal(executar({ type: 'entity.parse.failed' }).codigo, 400);
  assert.equal(executar({ type: 'entity.too.large' }).codigo, 413);
  assert.equal(executar({ name: 'MulterError' }).codigo, 400);
  assert.deepEqual(executar(new Error('boom')), { codigo: 500, corpo: { erro: 'Erro interno do servidor.' } });
  assert.deepEqual(executar(undefined), { codigo: 500, corpo: { erro: 'Erro interno do servidor.' } });

  const rota = chamar(rotaNaoEncontrada);
  assert.equal(rota.codigo, 404);
});

test('tempoRelativo', () => {
  const agora = Date.UTC(2026, 10, 26, 12, 0, 0);
  const em = (texto: string) => tempoRelativo(texto, agora);
  assert.equal(em('2026-11-26 12:00:00'), 'agora mesmo');
  assert.equal(em('2026-11-26 12:30:00'), 'agora mesmo'); // relógio adiantado
  assert.equal(em('2026-11-26 11:59:00'), 'há 1 minuto');
  assert.equal(em('2026-11-26 11:15:00'), 'há 45 minutos');
  assert.equal(em('2026-11-26 11:00:00'), 'há 1 hora');
  assert.equal(em('2026-11-25 12:00:00'), 'há 1 dia');
  assert.equal(em('2026-11-24 12:00:00'), 'há 2 dias');
  assert.equal(em('2026-11-19 12:00:00'), 'há 1 semana');
  assert.equal(em('2026-11-05 12:00:00'), 'há 3 semanas');
  assert.equal(em('2026-10-20 12:00:00'), 'há 1 mês');
  assert.equal(em('2026-05-20 12:00:00'), 'há 6 meses');
  assert.equal(em('2024-11-26 12:00:00'), 'há 2 anos');
  assert.equal(em('lixo'), '');
});

test('validação: nota e id', () => {
  const validas: Array<[unknown, number]> = [[1, 1], [4.5, 4.5], ['3', 3], [' 2.5 ', 2.5], [5, 5]];
  for (const [entrada, esperado] of validas) {
    assert.equal(lerNota(entrada), esperado, String(entrada));
  }
  const invalidas: unknown[] = [0.5, 5.5, 3.7, NaN, Infinity, null, undefined, [], {}, '1e0x'];
  for (const entrada of invalidas) {
    assert.equal(lerNota(entrada), null, String(entrada));
  }
  assert.equal(lerIDDaRota('12'), 12);
  const idsInvalidos: unknown[] = ['0', '-1', '01', '1.5', 'a', '', undefined, '1'.repeat(20)];
  for (const entrada of idsInvalidos) {
    assert.equal(lerIDDaRota(entrada), null, String(entrada));
  }
});
