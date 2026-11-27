# Backend — Sistema Colaborativo de Acessibilidade (TypeScript)

API em Node.js + Express + TypeScript, com banco SQLite. Roda no notebook e o
app (Expo) se conecta a ela pela rede local.

## Requisitos
- **Node 22.13 ou mais novo.** O SQLite usado já vem dentro do Node (nada para compilar).
- O TypeScript roda direto pelo **tsx** (instalado com `npm install`): não existe etapa de "build".

## Como rodar
1. Substitua a pasta `backend/` do projeto por esta.
2. Dentro de `backend/`: `npm install`
3. (Opcional) `npm run popular` — coloca no banco os mesmos dados de exemplo do app (McDonald's e 2 avaliações). Pode rodar de novo: não duplica.
4. `npm start` — o terminal mostra os endereços para usar no celular, por exemplo `http://192.168.0.10:3000`.
5. Teste no navegador do celular: `http://<IP-do-notebook>:3000/saude` deve mostrar `{"status":"ok"}`.

Notebook e celulares precisam estar na **mesma rede** (o mais seguro é o hotspot de um celular; redes de escola costumam bloquear a comunicação entre aparelhos). Se não abrir no celular, libere o Node no firewall do notebook.

Outros comandos:
- `npm run dev` — reinicia sozinho ao salvar um arquivo.
- `npm test` — testes automáticos (usam um banco temporário, não mexem no seu `.db`).
- `npm run typecheck` — o `tsc` confere todos os tipos sem gerar arquivos. Rode antes de commitar.

Configuração opcional: copie `.env.example` para `.env` (porta e caminho do banco).

## Contrato da API
Os nomes dos campos das respostas são os que o frontend atual já usa (tipados em `src/tipos/api.ts`). Todo erro vem como `{ "erro": "mensagem" }`.

| Método e endereço | Corpo enviado | Resposta |
|---|---|---|
| `GET /estabelecimentos?busca=texto` | — | `[{ id, nome, descricao, nota }]` |
| `GET /estabelecimentos/mapa` | — | `[{ id, nome, categoria, latitude, longitude, nota, totalAvaliacoes }]` (só locais que já têm localização) |
| `GET /estabelecimentos/:id` | — | `{ id, nome, categoria, endereco, descricao, notaMedia, totalAvaliacoes, imagemUrl, latitude, longitude }` (`latitude`/`longitude` são `null` se o local ainda não está no mapa) |
| `GET /estabelecimentos/:id/avaliacoes` | — | `[{ id, autor, data, nota, titulo?, comentario }]` |
| `POST /estabelecimentos` | multipart/form-data **ou** JSON: `nome`, `endereco`, `categoria`, `observacoes?`, `latitude?` + `longitude?` (as duas juntas) (e `imagem?`, ignorada por enquanto) | `201 { id }` |
| `PUT /estabelecimentos/:id/localizacao` | JSON: `latitude` (-90 a 90), `longitude` (-180 a 180) | `200 { id, latitude, longitude }` |
| `POST /estabelecimentos/:id/avaliacoes` | JSON: `nota`, `titulo?`, `comentario` | `201 { id }` |
| `GET /saude` | — | `{ status: "ok" }` |

Detalhes:
- `id` é sempre **texto** (`"1"`), como o frontend espera.
- `nota` / `notaMedia` são números (0 quando não há avaliações, nunca `null`). A nota enviada pode ir de 1 a 5 em passos de 0,5.
- `data` já vem pronta, como "há 2 dias".
- `autor` é "Usuário Anônimo" enquanto não houver login.
- `imagemUrl` é `null` por enquanto (fotos ainda não existem no backend).
- **Localização:** `latitude`/`longitude` são números em graus decimais. No `POST /estabelecimentos` (FormData) podem chegar como texto (`"-23.31"`); o backend converte. Enviar só uma das duas, ou um valor fora dos limites, dá `400`. `GET /estabelecimentos/mapa` precisa estar declarada antes de `/:id` em `estabelecimentoRoutes.ts`.
- Códigos: `200` ok, `201` criado, `400` dados inválidos, `404` não encontrado, `500` erro interno.

## Estrutura (o que cada arquivo faz)
```
backend/
├── package.json          dependências e comandos npm ("type": "module" = usa import/export)
├── tsconfig.json         configuração do TypeScript (modo estrito)
├── .env.example          modelo de configuração
├── .gitignore            não versionar node_modules, .env e o arquivo .db
├── data/                 aqui é criado o arquivo do banco (acessibilidade.db)
├── testes/api.test.ts    testes automáticos (npm test)
└── src/
    ├── servidor.ts       liga o servidor, confere a versão do Node, mostra os IPs
    ├── popular.ts        entrada do comando "npm run popular"
    ├── app.ts            monta o Express: cors, JSON, rotas, erros
    ├── tipos/
    │   ├── api.ts        formato do JSON que a API ENVIA (o contrato)
    │   └── banco.ts      formato das linhas do banco e dos dados de inserção
    ├── config/
    │   ├── ambiente.ts   lê o .env (porta, caminho do banco)
    │   ├── constantes.ts USUARIO_ANONIMO_ID = 1
    │   ├── banco.ts      abre o SQLite, liga as chaves estrangeiras, cria as tabelas e acrescenta colunas novas (garantirColuna)
    │   ├── esquema.sql   as tabelas Usuario, Estabelecimento (com latitude/longitude), Avaliacao
    │   └── popularBanco.ts  dados de exemplo
    ├── routes/estabelecimentoRoutes.ts   endereço -> controller
    ├── controllers/      conferem os dados e montam a resposta
    │   ├── estabelecimentoController.ts
    │   └── avaliacaoController.ts
    ├── models/           todo o SQL fica aqui (e só aqui)
    │   ├── estabelecimentoModel.ts
    │   └── avaliacaoModel.ts
    ├── middlewares/
    │   ├── lerMultipart.ts     lê o FormData do formulário "Adicionar"
    │   └── tratadorDeErros.ts  respostas de erro padronizadas
    └── utils/
        ├── validacao.ts        limites de tamanho, nota, id, busca sem acento
        ├── tempoRelativo.ts    "há 2 dias"
        └── resposta.ts         atalho para responder erros { erro }
```
Caminho de uma requisição: **rota → controller → model → banco** e volta.

## Como o TypeScript foi configurado
- **Modo estrito** (`"strict": true`): o compilador não deixa passar `null`/`undefined` sem tratamento.
- **ES Modules** (`import`/`export`): os imports de arquivos locais levam a extensão `.ts` (`import { db } from './banco.ts'`). É exigência de quem roda TypeScript direto.
- **Só sintaxe "apagável"** (`erasableSyntaxOnly`): sem `enum` e sem outros recursos que geram código. Assim o mesmo código roda pelo `tsx` e também direto pelo Node mais novo (22.18+: `node src/servidor.ts`).
- **Dados de fora são `unknown`:** tudo que chega do app (corpo, parâmetros) é tratado como `unknown` e passa por `lerTexto`, `lerNota` e `lerIDDaRota` antes de ser usado.
- **Linhas do banco:** o SQLite devolve objetos genéricos; os models dizem ao TypeScript o formato real (`tipos/banco.ts`) com `as unknown as ...`. Se mudarem um SELECT, atualizem o tipo correspondente.

## Decisões importantes
- **Sem login por enquanto:** tudo é criado pelo usuário anônimo (id 1, e-mail fictício). Quando houver login, trocar `USUARIO_ANONIMO_ID` nos dois controllers pelo usuário logado.
- **Nota em `REAL` (meias estrelas):** o banco aceita 1, 1.5, 2 ... 5 e recusa o resto (ex.: 3.7). A média é calculada na hora (`AVG`), nunca gravada.
- **Comentário dentro de Avaliacao:** a coluna `comentario` é opcional no banco, mas o backend o exige (o app exige). Se um dia for opcional de verdade, basta tirar essa regra do controller.
- **Sem listas nem chaves circulares:** as relações ficam só no lado "muitos" (`Avaliacao.usuarioID`, `Avaliacao.estabelecimentoID`, `Estabelecimento.usuarioID`). "Avaliações do usuário X" é uma consulta, não uma coluna.
- **Busca por nome** é feita no código (ignora maiúsculas e acentos: "cafe" acha "Café"). Para poucos estabelecimentos é ótimo; com muitos, mover para o SQL.
- **Localização opcional no banco:** `Estabelecimento.latitude` e `longitude` aceitam `NULL`, porque os locais cadastrados antes do mapa não têm localização. Em um banco que já existe, `banco.ts` (`garantirColuna`) acrescenta as duas colunas sozinho ao iniciar o servidor, sem apagar nada e sem duplicar se rodar de novo. Quem decide que o app EXIGE localização em novos cadastros é o frontend; a API continua aceitando cadastro sem ela.
- **Sem dono da localização:** enquanto não houver login, qualquer pessoa pode corrigir a localização de um local (`PUT .../localizacao`). Com login, restringir a quem cadastrou o local.
- **Categoria livre:** o backend aceita qualquer texto (até 50 caracteres) para vocês poderem mudar a lista do app sem mexer aqui.

## Como ativar as fotos depois
1. `esquema.sql` e o banco: adicionar a coluna `imagem TEXT` em `Estabelecimento` (num banco que já existe: `ALTER TABLE Estabelecimento ADD COLUMN imagem TEXT;`) e o campo `imagem` nos tipos de `tipos/banco.ts`.
2. `middlewares/lerMultipart.ts`: trocar `multer.memoryStorage()` por `multer.diskStorage(...)` gravando em `uploads/` com nome único (aceitar só jpeg/png).
3. `app.ts`: `app.use('/uploads', express.static(...))` para servir as imagens.
4. `estabelecimentoModel.ts` e o controller: gravar o nome do arquivo em `imagem` e devolver `imagemUrl` com o endereço completo (o tipo `EstabelecimentoDetalhe` já prevê `string | null`).

## Próximos passos possíveis
- Login/cadastro de usuários (guardar senha só com hash).
- Filtrar `GET /estabelecimentos/mapa` pela área visível do mapa (hoje devolve todos os pontos, o que é ótimo para poucos locais).
- Impedir mais de uma avaliação por usuário no mesmo local (só faz sentido depois do login).

## Para quem cuida do frontend
- Trocar os mocks por `fetch` usando `http://<IP-do-notebook>:3000` como base.
- A tela de busca usa o campo `nota`; a de detalhes usa `notaMedia` (o backend já envia cada um com o nome certo).
- `src/tipos/api.ts` pode ser copiado para o frontend para tipar as respostas.
- Para mostrar **meias estrelas**, o componente de estrelas precisará tratar valores como 4.5 (hoje arredonda para baixo).
