// Acompanha a localização do usuário em tempo real enquanto a tela está em foco.
//
// - Pede a permissão de localização.
// - Assim que há uma posição, "posicao" passa a ser preenchida e é atualizada a cada
//   movimento (a cada 5 metros ou 3 segundos, o que acontecer primeiro).
// - Quando a tela perde o foco (o usuário troca de aba), o acompanhamento PARA, para não
//   gastar bateria à toa. Ao voltar, recomeça sozinho.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import type { Coordenada } from '../utils/localizacao';

export type StatusLocalizacao =
  | 'verificando' // ainda pedindo a permissão
  | 'concedida'   // permissão ok (a posição pode demorar alguns segundos para chegar)
  | 'negada'      // o usuário recusou a permissão
  | 'desligada'   // o GPS do celular está desligado
  | 'erro';       // qualquer outra falha

export function useLocalizacaoAtual() {
  const [posicao, setPosicao] = useState<Coordenada | null>(null);
  const [status, setStatus] = useState<StatusLocalizacao>('verificando');
  const [tentativa, setTentativa] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let ativo = true; // evita atualizar a tela depois que ela perdeu o foco
      let assinatura: Location.LocationSubscription | null = null;

      async function iniciar() {
        try {
          const permissao = await Location.requestForegroundPermissionsAsync();
          if (!ativo) return;
          if (!permissao.granted) {
            setStatus('negada');
            return;
          }

          if (!(await Location.hasServicesEnabledAsync())) {
            if (ativo) setStatus('desligada');
            return;
          }
          if (!ativo) return;
          setStatus('concedida');

          // Última posição conhecida do aparelho: chega na hora e evita a tela vazia
          // enquanto o GPS "esquenta". Pode ser null (então esperamos o GPS).
          const ultima = await Location.getLastKnownPositionAsync();
          if (ativo && ultima) {
            setPosicao({ latitude: ultima.coords.latitude, longitude: ultima.coords.longitude });
          }

          assinatura = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 3000 },
            (local) => {
              if (!ativo) return;
              setPosicao({ latitude: local.coords.latitude, longitude: local.coords.longitude });
            }
          );

          // A tela pode ter sido fechada enquanto esperávamos acima: então já desligamos.
          if (!ativo) assinatura.remove();
        } catch {
          if (ativo) setStatus('erro');
        }
      }

      iniciar();
      return () => {
        ativo = false;
        assinatura?.remove();
      };
    }, [tentativa])
  );

  function tentarNovamente() {
    setStatus('verificando');
    setTentativa((anterior) => anterior + 1);
  }

  return { posicao, status, tentarNovamente };
}
