// Funções de apoio para localização e mapa. Tudo o que fala com o GPS ou com o
// "geocodificador" do aparelho (expo-location) fica aqui, para as telas ficarem simples.
import * as Location from 'expo-location';
import type { Region } from 'react-native-maps';

export interface Coordenada {
  latitude: number;
  longitude: number;
}

// Tamanho da área mostrada no mapa ao "chegar perto" (quanto menor, mais zoom). Cerca de 1 km.
export const DELTA_ZOOM_PERTO = 0.01;

// Região mostrada enquanto o app ainda não sabe onde o usuário está (o Brasil inteiro).
export const REGIAO_INICIAL: Region = {
  latitude: -14.235,
  longitude: -51.925,
  latitudeDelta: 35,
  longitudeDelta: 35,
};

// Região (centro + zoom) para mostrar uma coordenada de perto.
export function regiaoEm(coordenada: Coordenada, delta: number = DELTA_ZOOM_PERTO): Region {
  return {
    latitude: coordenada.latitude,
    longitude: coordenada.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

// Texto curto para mostrar na tela, ex.: "-23.31050, -51.16280"
export function formatarCoordenada(coordenada: Coordenada): string {
  return `${coordenada.latitude.toFixed(5)}, ${coordenada.longitude.toFixed(5)}`;
}

// Pede ao usuário a permissão de localização (só enquanto o app está aberto).
// Se ele já respondeu antes, o sistema não pergunta de novo: só devolve a resposta guardada.
export async function pedirPermissaoDeLocalizacao(): Promise<boolean> {
  const permissao = await Location.requestForegroundPermissionsAsync();
  return permissao.granted;
}

// Lê a posição atual UMA vez (usado pelos botões "usar minha localização").
// Lança erro se o GPS estiver desligado ou não conseguir uma posição.
export async function obterPosicaoAtual(): Promise<Coordenada> {
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { latitude: coords.latitude, longitude: coords.longitude };
}

// Transforma um endereço escrito (ex.: "Rua Sergipe, 500") em coordenadas. Devolve null se
// o aparelho não encontrar. Quando sabemos onde o usuário está ("perto"), acrescentamos a cidade
// dele ao endereço: "Rua Sergipe, 500" existe em muitas cidades, e assim a busca acerta a certa.
// O resultado é só uma SUGESTÃO: o usuário confere o pino no mapa e pode ajustá-lo.
export async function buscarCoordenadaDoEndereco(
  endereco: string,
  perto?: Coordenada | null
): Promise<Coordenada | null> {
  let consulta = endereco;

  if (perto) {
    try {
      const [lugar] = await Location.reverseGeocodeAsync(perto);
      const cidade = lugar?.city ?? lugar?.subregion;
      if (cidade) {
        consulta = `${endereco}, ${cidade}${lugar?.region ? ` - ${lugar.region}` : ''}`;
      }
    } catch {
      // sem a cidade a busca ainda funciona, só fica menos precisa
    }
  }

  const resultados = await Location.geocodeAsync(consulta);
  if (resultados.length === 0) return null;
  return { latitude: resultados[0].latitude, longitude: resultados[0].longitude };
}
