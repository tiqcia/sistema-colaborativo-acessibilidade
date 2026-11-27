// Model de Avaliacao: só SQL. O antigo "Comentario" é a coluna "comentario".
import { db } from '../config/banco.ts';
import type { LinhaAvaliacao, NovaAvaliacao } from '../tipos/banco.ts';

// Avaliações de um estabelecimento, da mais nova para a mais antiga.
// O nome do autor vem da tabela Usuario.
export function listarAvaliacoesDoEstabelecimento(estabelecimentoID: number): LinhaAvaliacao[] {
  return db.prepare(`
    SELECT a.avaliacaoID, u.nome AS autor, a.qtdEstrelas, a.titulo, a.comentario, a.criadoEm
    FROM Avaliacao a
    JOIN Usuario u ON u.usuarioID = a.usuarioID
    WHERE a.estabelecimentoID = ?
    ORDER BY a.criadoEm DESC, a.avaliacaoID DESC
  `).all(estabelecimentoID) as unknown as LinhaAvaliacao[];
}

// Insere e devolve o avaliacaoID gerado.
export function criarAvaliacao(dados: NovaAvaliacao): number {
  const resultado = db.prepare(`
    INSERT INTO Avaliacao (usuarioID, estabelecimentoID, qtdEstrelas, titulo, comentario)
    VALUES (?, ?, ?, ?, ?)
  `).run(dados.usuarioID, dados.estabelecimentoID, dados.qtdEstrelas, dados.titulo, dados.comentario);
  return Number(resultado.lastInsertRowid);
}
