# Implementação do mapa — passos para executar

Esta versão adiciona mapa interativo ao app e localização de estabelecimentos existentes.

## Alterações
- SQLite: `latitude` e `longitude` adicionadas à tabela Estabelecimento. Inicialização tenta migrar bancos antigos automaticamente.
- Backend: `GET /estabelecimentos/mapa` lista locais (inclusive sem coordenadas), `PATCH /estabelecimentos/:id/localizacao` grava coordenadas.
- Frontend: tela principal renderiza MapView, localização atual do dispositivo, pins e seleção de estabelecimentos sem localização.
- Pressione um estabelecimento sem pin na lista superior e, depois, mantenha pressionado no mapa no ponto escolhido para gravar coordenadas.
- Selecionar um pin permite abrir a página de avaliações.

## Executar backend
1. Abra terminal na pasta `backend`.
2. `npm install` (ou mantenha sua instalação existente).
3. `npm start` (ou `npm run dev`).
4. O servidor deve estar acessível pelo IP local do notebook na porta 3000.

## Executar mobile / Expo Go
1. Abra outro terminal na pasta `frontend`.
2. Instale os módulos do mapa/localização compatíveis com sua versão Expo: `npx expo install react-native-maps expo-location`.
3. Confira `frontend/.env.local`: `EXPO_PUBLIC_API_URL=http://IP-LOCAL-DO-NOTEBOOK:3000` (substitua pelo IP do computador, não use localhost).
4. `npm install`.
5. `npx expo start --clear`.
6. Celular e notebook devem estar na mesma rede Wi-Fi. Abra o QR code no Expo Go.
7. No mapa, permita localização quando o sistema pedir.

## Se o celular não acessar o backend
- Confira `/saude` no navegador do celular: `http://IP-LOCAL-DO-NOTEBOOK:3000/saude`.
- Libere Node/porta 3000 no firewall do notebook.
- O IP precisa ser o IP de rede do notebook. `localhost` no celular aponta para o próprio celular.

## Limitações desta implementação
- GPS: localização do usuário é exibida pelo MapView; nesta versão captura a posição inicial e não mantém rastreamento contínuo por watch.
- A lista de locais sem coordenadas exibe até quatro por vez para manter a interface compacta.
- Pins de estabelecimentos existentes são vinculados ao banco; avaliações continuam usando a relação atual.
