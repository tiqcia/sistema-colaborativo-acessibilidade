// Model de Estabelecimento: só conversa com o banco (SQL). Não sabe nada de HTTP.
// Sempre usa "?" no lugar dos valores: o banco recebe os valores separados do
// comando SQL, o que impede "SQL injection".
//
// O banco devolve linhas genéricas; o "as unknown as ..." diz ao TypeScript
// qual é o formato real (definido em tipos/banco.ts, conforme o SELECT).
import { db } from '../config/banco.ts';
import type {
  LinhaEstabelecimentoDetalhe,
  LinhaEstabelecimentoResumo,
  NovoEstabelecimento,
} from '../tipos/banco.ts';

// Lista todos com a nota média (0 se ainda não tiver avaliações).
export function listarEstabelecimentos(): LinhaEstabelecimentoResumo[] {
  return db.prepare(`
    SELECT e.estabelecimentoID, e.nome, e.descricao, e.latitude, e.longitude,
           COALESCE(ROUND(AVG(a.qtdEstrelas), 1), 0) AS notaMedia
    FROM Estabelecimento e
    LEFT JOIN Avaliacao a ON a.estabelecimentoID = e.estabelecimentoID
    GROUP BY e.estabelecimentoID
    ORDER BY e.nome COLLATE NOCASE
  `).all() as unknown as LinhaEstabelecimentoResumo[];
}

// Um estabelecimento com nota média e total de avaliações. undefined se não existir.
export function buscarEstabelecimentoPorID(estabelecimentoID: number): LinhaEstabelecimentoDetalhe | undefined {
  return db.prepare(`
    SELECT e.estabelecimentoID, e.nome, e.categoria, e.endereco, e.descricao, e.latitude, e.longitude,
           COALESCE(ROUND(AVG(a.qtdEstrelas), 1), 0) AS notaMedia,
           COUNT(a.avaliacaoID) AS totalAvaliacoes
    FROM Estabelecimento e
    LEFT JOIN Avaliacao a ON a.estabelecimentoID = e.estabelecimentoID
    WHERE e.estabelecimentoID = ?
    GROUP BY e.estabelecimentoID
  `).get(estabelecimentoID) as unknown as LinhaEstabelecimentoDetalhe | undefined;
}

export function existeEstabelecimento(estabelecimentoID: number): boolean {
  return db.prepare('SELECT 1 FROM Estabelecimento WHERE estabelecimentoID = ?')
    .get(estabelecimentoID) !== undefined;
}

// Insere e devolve o estabelecimentoID gerado.
export function criarEstabelecimento(dados: NovoEstabelecimento): number {
  const resultado = db.prepare(`
    INSERT INTO Estabelecimento (usuarioID, nome, endereco, categoria, descricao)
    VALUES (?, ?, ?, ?, ?)
  `).run(dados.usuarioID, dados.nome, dados.endereco, dados.categoria, dados.descricao);
  return Number(resultado.lastInsertRowid);
}

// Atualiza a localização geográfica de um estabelecimento já existente.
export function atualizarLocalizacao(estabelecimentoID: number, latitude: number, longitude: number): void {
  db.prepare('UPDATE Estabelecimento SET latitude = ?, longitude = ? WHERE estabelecimentoID = ?')
    .run(latitude, longitude, estabelecimentoID);
}

// Retorna somente estabelecimentos que já possuem coordenadas, para pins do mapa.
export function listarEstabelecimentosComLocalizacao() {
  return db.prepare(`
    SELECT estabelecimentoID, nome, endereco, categoria, latitude, longitude
    FROM Estabelecimento
    ORDER BY nome COLLATE NOCASE
  `).all() as Array<{ estabelecimentoID: number; nome: string; endereco: string; categoria: string; latitude: number | null; longitude: number | null }>;
}
