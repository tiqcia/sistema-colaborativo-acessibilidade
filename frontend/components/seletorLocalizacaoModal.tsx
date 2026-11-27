import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import {
  Coordenada,
  REGIAO_INICIAL,
  buscarCoordenadaDoEndereco,
  formatarCoordenada,
  obterPosicaoAtual,
  pedirPermissaoDeLocalizacao,
  regiaoEm,
} from '../utils/localizacao';

interface SeletorLocalizacaoModalProps {
  visible: boolean;
  titulo?: string;
  // Endereço escrito do local: habilita o botão "Procurar pelo endereço"
  endereco?: string;
  // Localização que o local já tem (se tiver): o pino já abre nela
  coordenadaInicial?: Coordenada | null;
  // true enquanto o pai está gravando no servidor (desabilita o botão de confirmar)
  salvando?: boolean;
  onConfirmar: (coordenada: Coordenada) => void;
  onFechar: () => void;
}

// Tela cheia com um mapa para o usuário escolher onde fica um estabelecimento.
// Ele pode: tocar no mapa, arrastar o pino, usar a própria localização ou procurar pelo endereço.
// O componente só ESCOLHE a coordenada; quem grava (no formulário ou no servidor) é o pai.
export function SeletorLocalizacaoModal({
  visible,
  titulo = 'Marcar no mapa',
  endereco,
  coordenadaInicial,
  salvando = false,
  onConfirmar,
  onFechar,
}: SeletorLocalizacaoModalProps) {
  const mapaRef = useRef<MapView>(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  const [escolhida, setEscolhida] = useState<Coordenada | null>(null);
  const [temPermissao, setTemPermissao] = useState(false); // para mostrar a bolinha azul "você está aqui"
  const [ocupado, setOcupado] = useState(false);           // procurando endereço / lendo o GPS

  // Toda vez que o modal ABRE, o pino volta a ser o que o local já tinha (ou nenhum).
  // De propósito só "visible" está na lista: se "coordenadaInicial" estivesse aqui, o pino
  // que o usuário acabou de escolher seria apagado a cada atualização da tela do pai.
  useEffect(() => {
    if (visible) {
      setEscolhida(coordenadaInicial ?? null);
    } else {
      setMapaPronto(false); // o mapa é recriado a cada abertura
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sem localização anterior, leva o mapa para perto de onde o usuário está
  // (sem colocar pino: quem decide o ponto é o usuário).
  useEffect(() => {
    if (!visible || !mapaPronto || coordenadaInicial) return;
    let ativo = true;

    async function irParaOUsuario() {
      try {
        if (!(await pedirPermissaoDeLocalizacao())) return;
        if (ativo) setTemPermissao(true);
        const posicao = await obterPosicaoAtual();
        if (ativo) mapaRef.current?.animateToRegion(regiaoEm(posicao), 600);
      } catch {
        // sem GPS: tudo bem, o usuário ainda pode navegar pelo mapa ou procurar o endereço
      }
    }

    irParaOUsuario();
    return () => {
      ativo = false;
    };
  }, [visible, mapaPronto]); // eslint-disable-line react-hooks/exhaustive-deps

  function colocarPino(coordenada: Coordenada) {
    setEscolhida(coordenada);
    mapaRef.current?.animateToRegion(regiaoEm(coordenada), 600);
  }

  async function usarMinhaLocalizacao() {
    try {
      setOcupado(true);
      if (!(await pedirPermissaoDeLocalizacao())) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à localização para usar a sua posição atual.'
        );
        return;
      }
      setTemPermissao(true);
      colocarPino(await obterPosicaoAtual());
    } catch {
      Alert.alert(
        'Não foi possível obter sua localização',
        'Confira se o GPS do celular está ligado e tente novamente.'
      );
    } finally {
      setOcupado(false);
    }
  }

  async function procurarPeloEndereco() {
    if (!endereco || !endereco.trim()) return;

    try {
      setOcupado(true);

      // Se o usuário permitiu a localização, usamos a cidade dele para melhorar a busca
      let perto: Coordenada | null = null;
      try {
        if (await pedirPermissaoDeLocalizacao()) {
          setTemPermissao(true);
          perto = await obterPosicaoAtual();
        }
      } catch {
        // segue sem a cidade
      }

      const encontrada = await buscarCoordenadaDoEndereco(endereco.trim(), perto);
      if (!encontrada) {
        Alert.alert(
          'Endereço não encontrado',
          'Não achamos esse endereço no mapa. Toque no mapa para marcar o local manualmente.'
        );
        return;
      }
      colocarPino(encontrada);
    } catch {
      Alert.alert(
        'Não foi possível procurar o endereço',
        'Toque no mapa para marcar o local manualmente.'
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onFechar}>
      <View style={styles.container}>
        <MapView
          ref={mapaRef}
          style={StyleSheet.absoluteFill}
          initialRegion={coordenadaInicial ? regiaoEm(coordenadaInicial) : REGIAO_INICIAL}
          onMapReady={() => setMapaPronto(true)}
          onPress={(evento) => setEscolhida(evento.nativeEvent.coordinate)}
          showsUserLocation={temPermissao}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {escolhida && (
            <Marker
              coordinate={escolhida}
              draggable
              onDragEnd={(evento) => setEscolhida(evento.nativeEvent.coordinate)}
              pinColor="#b81d59"
            />
          )}
        </MapView>

        {/* Botão de fechar (mesmo estilo do BotaoVoltar) */}
        <TouchableOpacity
          style={styles.botaoFechar}
          onPress={onFechar}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Fechar o mapa sem salvar a localização"
        >
          <Ionicons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* Instruções */}
        <View style={styles.instrucao}>
          <Text style={styles.instrucaoTitulo}>{titulo}</Text>
          <Text style={styles.instrucaoTexto}>
            Toque no mapa para colocar o pino. Para ajustar, segure o pino e arraste.
          </Text>
        </View>

        {/* Painel inferior */}
        <View style={styles.painel}>
          <View style={styles.linhaBotoes}>
            <TouchableOpacity
              style={[styles.botaoAuxiliar, ocupado && styles.desabilitado]}
              onPress={usarMinhaLocalizacao}
              disabled={ocupado}
              accessibilityRole="button"
              accessibilityLabel="Usar a minha localização atual"
            >
              <Ionicons name="locate" size={18} color="#3b34c9" />
              <Text style={styles.botaoAuxiliarTexto}>Minha localização</Text>
            </TouchableOpacity>

            {!!endereco?.trim() && (
              <TouchableOpacity
                style={[styles.botaoAuxiliar, ocupado && styles.desabilitado]}
                onPress={procurarPeloEndereco}
                disabled={ocupado}
                accessibilityRole="button"
                accessibilityLabel="Procurar no mapa o endereço informado"
              >
                <Ionicons name="search" size={18} color="#3b34c9" />
                <Text style={styles.botaoAuxiliarTexto}>Pelo endereço</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.coordenadaTexto}>
            {ocupado
              ? 'Procurando...'
              : escolhida
                ? `Pino em: ${formatarCoordenada(escolhida)}`
                : 'Nenhum ponto marcado ainda.'}
          </Text>

          <TouchableOpacity
            style={[styles.botaoConfirmar, (!escolhida || salvando) && styles.desabilitado]}
            onPress={() => escolhida && onConfirmar(escolhida)}
            disabled={!escolhida || salvando}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Confirmar a localização marcada"
          >
            {salvando ? (
              <ActivityIndicator color="#1e293b" />
            ) : (
              <Text style={styles.botaoConfirmarTexto}>Confirmar localização</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  botaoFechar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3b34c9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  instrucao: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    left: 72,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  instrucaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  instrucaoTexto: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 17,
  },
  painel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoAuxiliar: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#3b34c9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoAuxiliarTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b34c9',
  },
  coordenadaTexto: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  botaoConfirmar: {
    height: 48,
    backgroundColor: '#fbc07a',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoConfirmarTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  desabilitado: {
    opacity: 0.5,
  },
});
