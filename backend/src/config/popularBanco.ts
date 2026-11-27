// Coloca no banco os mesmos dados de exemplo (mocks) que o frontend usa hoje,
// para a tela não ficar vazia. Rode com:  npm run popular
// Só insere se ainda não houver nenhum estabelecimento (não duplica).
import { db, emTransacao } from './banco.ts';
import { USUARIO_ANONIMO_ID } from './constantes.ts';

// Devolve true se inseriu os dados, false se o banco já tinha estabelecimentos.
export function popular(): boolean {
  const contagem = db.prepare('SELECT COUNT(*) AS total FROM Estabelecimento').get() as unknown as { total: number };
  if (contagem.total > 0) return false;

  emTransacao(() => {
    // Autor da primeira avaliação de exemplo
    db.prepare("INSERT OR IGNORE INTO Usuario (nome, email) VALUES ('Fulano', 'fulano@example.com')").run();
    const fulano = db
      .prepare("SELECT usuarioID FROM Usuario WHERE email = 'fulano@example.com'")
      .get() as unknown as { usuarioID: number };

    const estabelecimentoID = Number(
      db.prepare(
        `INSERT INTO Estabelecimento (usuarioID, nome, endereco, categoria, descricao)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        USUARIO_ANONIMO_ID,
        "McDonald's",
        'R. Miguel Couto, 67 - Jardim Shangri-Lá',
        'Lanchonete',
        'Rede de fast-food tradicional conhecida por ter ótimos hambúrgueres e batatas fritas.'
      ).lastInsertRowid
    );

    const inserirAvaliacao = db.prepare(
      `INSERT INTO Avaliacao (usuarioID, estabelecimentoID, qtdEstrelas, titulo, comentario, criadoEm)
       VALUES (?, ?, ?, ?, ?, datetime('now', ?))`
    );

    inserirAvaliacao.run(
      fulano.usuarioID, estabelecimentoID, 4,
      'Entrada ok, banheiro não',
      'A rampa da entrada é larga e tem corrimão. Dentro, o salão tem espaço para cadeira de rodas, mas o banheiro adaptado estava interditado para manutenção durante toda a tarde.',
      '-2 days'
    );
    inserirAvaliacao.run(
      USUARIO_ANONIMO_ID, estabelecimentoID, 5,
      'Ótimo atendimento e acesso',
      'Bom espaço entre as mesas para circulação de cadeira de rodas e cardápio de fácil leitura.',
      '-7 days'
    );
  });

  return true;
}
