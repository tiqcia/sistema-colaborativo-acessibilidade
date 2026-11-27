// Ponto de entrada: liga o servidor.   Rode com:  npm start
import { networkInterfaces, type NetworkInterfaceInfo } from 'node:os';

// O SQLite embutido no Node exige a versão 22.13 ou mais nova.
// Conferimos ANTES de carregar o resto (por isso os "await import" abaixo,
// em vez de import no topo) para dar uma mensagem clara em vez de um erro confuso.
const [versaoMaior, versaoMenor] = process.versions.node.split('.').map(Number);
if (versaoMaior < 22 || (versaoMaior === 22 && versaoMenor < 13)) {
  console.error(`O Node ${process.versions.node} é antigo demais. Instale o Node 22.13 ou mais novo.`);
  process.exit(1);
}

const { default: app } = await import('./app.ts');
const { PORTA, CAMINHO_BANCO } = await import('./config/ambiente.ts');

// Endereços IPv4 deste computador na rede (os que o celular vai usar).
function enderecosDeRede(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((rede): rede is NetworkInterfaceInfo => rede !== undefined && rede.family === 'IPv4' && !rede.internal)
    .map((rede) => rede.address);
}

// '0.0.0.0' = aceitar conexões de qualquer aparelho da rede, não só deste computador.
const servidor = app.listen(PORTA, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
  console.log(`Banco de dados: ${CAMINHO_BANCO}`);
  console.log('No celular (mesma rede), use um destes endereços como base da API:');
  for (const ip of enderecosDeRede()) {
    console.log(`  http://${ip}:${PORTA}   (teste no navegador do celular: http://${ip}:${PORTA}/saude)`);
  }
});

servidor.on('error', (erro: NodeJS.ErrnoException) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(`A porta ${PORTA} já está em uso. Feche o outro programa ou mude PORTA no arquivo .env.`);
  } else {
    console.error(erro);
  }
  process.exit(1);
});
