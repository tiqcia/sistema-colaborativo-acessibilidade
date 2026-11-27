-- Esquema do banco (SQLite). Executado toda vez que o servidor inicia.
-- Todos os comandos usam "IF NOT EXISTS" / "OR IGNORE", então rodar de novo
-- não apaga nem duplica nada.

-- ------------------------------------------------------------------
-- Usuario
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Usuario (
  usuarioID    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome         TEXT NOT NULL,
  -- UNIQUE + NOCASE: "A@x.com" e "a@x.com" contam como o mesmo e-mail.
  email        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  -- Lista de necessidades de acessibilidade, guardada como texto JSON
  -- (ex.: '["item1","item2"]'). Ainda não é usada pela API.
  -- O CHECK garante que, se preenchido, seja um JSON de lista válido.
  assistencias TEXT CHECK (
    assistencias IS NULL
    OR CASE WHEN json_valid(assistencias)
            THEN json_type(assistencias) = 'array'
            ELSE 0 END
  )
);

-- ------------------------------------------------------------------
-- Estabelecimento (cada um é cadastrado por 1 Usuario)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Estabelecimento (
  estabelecimentoID INTEGER PRIMARY KEY AUTOINCREMENT,
  usuarioID         INTEGER NOT NULL REFERENCES Usuario(usuarioID),
  nome              TEXT NOT NULL,
  endereco          TEXT NOT NULL,
  categoria         TEXT NOT NULL,
  descricao         TEXT,
  -- Data/hora em UTC, no formato "AAAA-MM-DD HH:MM:SS"
  criadoEm          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  -- FOTOS (futuro): adicionar a coluna  imagem TEXT  (caminho do arquivo).
);

-- ------------------------------------------------------------------
-- Avaliacao (feita por 1 Usuario, sobre 1 Estabelecimento)
-- O antigo "Comentario" agora é a coluna "comentario" daqui.
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Avaliacao (
  avaliacaoID       INTEGER PRIMARY KEY AUTOINCREMENT,
  usuarioID         INTEGER NOT NULL REFERENCES Usuario(usuarioID),
  -- Se o estabelecimento for apagado, as avaliações dele vão junto.
  estabelecimentoID INTEGER NOT NULL
                    REFERENCES Estabelecimento(estabelecimentoID) ON DELETE CASCADE,
  -- REAL = número com vírgula. Aceita de 1 a 5 em passos de 0,5
  -- (1, 1.5, 2, ..., 5). A segunda condição rejeita valores como 3.7:
  -- só passa se (nota x 2) for um número inteiro.
  qtdEstrelas       REAL NOT NULL CHECK (
    qtdEstrelas BETWEEN 1 AND 5
    AND qtdEstrelas * 2 = ROUND(qtdEstrelas * 2)
  ),
  titulo            TEXT,   -- opcional
  -- Opcional no banco; o app exige o preenchimento e o backend confere isso.
  comentario        TEXT,
  criadoEm          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Acelera "todas as avaliações deste estabelecimento" e a média das notas.
CREATE INDEX IF NOT EXISTS idxAvaliacaoEstabelecimento
  ON Avaliacao (estabelecimentoID);

-- ------------------------------------------------------------------
-- Usuário anônimo (usuarioID = 1). O e-mail é fictício: não será usado.
-- ------------------------------------------------------------------
INSERT OR IGNORE INTO Usuario (usuarioID, nome, email)
VALUES (1, 'Usuário Anônimo', 'anonimo@example.com');
