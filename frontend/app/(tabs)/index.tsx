import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { EstrelasAvaliacao } from '../../components/estrelasAvaliacao';
import { useLocalizacaoAtual } from '../../hooks/useLocalizacaoAtual';
import { REGIAO_INICIAL, regiaoEm } from '../../utils/localizacao';
import { api, mensagemDeErro } from '../../services/api';
import type { EstabelecimentoNoMapa } from '../../services/api';

// Mensagem mostrada no topo do mapa (com um botão opcional de ação)
interface Aviso {
  texto: string;
  acao?: { rotulo: string; aoPressionar: () => void };
}

export default function MapaScreen() {
  const mapaRef = useRef<MapView>(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  const primeiraPosicao = useRef(true); // true até o mapa dar o primeiro "zoom" no usuário

  // Posição do usuário, atualizada em tempo real enquanto esta aba está aberta
  const { posicao, status, tentarNovamente: tentarLocalizacaoNovamente } = useLocalizacaoAtual();
  const [seguindo, setSeguindo] = useState(true); // true = o mapa acompanha o usuário

  // Pinos vindos do servidor (só estabelecimentos que já têm localização)
  const [pontos, setPontos] = useState<EstabelecimentoNoMapa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  // Recarrega os pinos toda vez que a aba ganha foco. Assim, uma avaliação nova (ou um local
  // que acabou de ganhar localização) já aparece aqui ao voltar.
  useFocusEffect(
    useCallback(() => {
      let ativo = true; // evita atualizar a tela se ela já perdeu o foco

      async function carregarPontos() {
        try {
          const lista = await api.listarEstabelecimentosNoMapa();
          if (!ativo) return;
          setPontos(lista);
          setErro(null);
        } catch (e) {
          if (!ativo) return;
          setErro(mensagemDeErro(e));
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregarPontos();
      return () => {
        ativo = false;
      };
    }, [tentativa])
  );

  function recarregarPontos() {
    setErro(null);
    setTentativa((anterior) => anterior + 1);
  }

  // Acompanha o usuário: no primeiro GPS dá zoom perto dele; depois, se "seguindo" estiver
  // ligado, só desliza o centro do mapa (sem mexer no zoom que o usuário escolheu).
  useEffect(() => {
    if (!posicao || !mapaPronto) return;

    if (primeiraPosicao.current) {
      primeiraPosicao.current = false;
      mapaRef.current?.animateToRegion(regiaoEm(posicao), 800);
      return;
    }
    if (seguindo) {
      mapaRef.current?.animateCamera({ center: posicao }, { duration: 500 });
    }
  }, [posicao, mapaPronto, seguindo]);

  function selecionarPonto(ponto: EstabelecimentoNoMapa) {
    setSelecionadoId(ponto.id);
    setSeguindo(false); // senão o mapa voltaria para o usuário a cada atualização do GPS
  }

  const pontoSelecionado = pontos.find((p) => p.id === selecionadoId) ?? null;

  // Escolhe UM aviso para mostrar no topo (o mais importante primeiro)
  function obterAviso(): Aviso | null {
    if (status === 'negada') {
      return {
        texto: 'Sem permissão de localização. Permita o acesso para ver onde você está no mapa.',
        acao: { rotulo: 'Abrir configurações', aoPressionar: () => Linking.openSettings() },
      };
    }
    if (status === 'desligada') {
      return {
        texto: 'O GPS do celular está desligado. Ligue-o para ver onde você está.',
        acao: { rotulo: 'Tentar novamente', aoPressionar: tentarLocalizacaoNovamente },
      };
    }
    if (status === 'erro') {
      return {
        texto: 'Não foi possível obter a sua localização.',
        acao: { rotulo: 'Tentar novamente', aoPressionar: tentarLocalizacaoNovamente },
      };
    }
    if (erro) {
      return { texto: erro, acao: { rotulo: 'Tentar novamente', aoPressionar: recarregarPontos } };
    }
    if (status === 'concedida' && !posicao) {
      return { texto: 'Obtendo a sua localização...' };
    }
    if (!carregando && pontos.length === 0) {
      return {
        texto:
          'Nenhum local no mapa ainda. Cadastre um local ou marque a localização de um existente na tela de detalhes dele.',
      };
    }
    return null;
  }
  const aviso = obterAviso();

  return (
    <View style={styles.container}>
      <MapView
        ref={mapaRef}
        style={StyleSheet.absoluteFill}
        initialRegion={REGIAO_INICIAL}
        onMapReady={() => setMapaPronto(true)}
        showsUserLocation={status === 'concedida'}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        // Se o USUÁRIO mexer no mapa, para de segui-lo (os movimentos feitos pelo
        // próprio app, com animateToRegion/animateCamera, não contam como gesto)
        onRegionChangeComplete={(_regiao, detalhes) => {
          if (detalhes?.isGesture) setSeguindo(false);
        }}
      >
        {pontos.map((ponto) => (
          <Marker
            key={ponto.id}
            coordinate={{ latitude: ponto.latitude, longitude: ponto.longitude }}
            pinColor={ponto.id === selecionadoId ? '#4338CA' : '#b81d59'}
            onPress={() => selecionarPonto(ponto)}
          />
        ))}
      </MapView>

      {/* Aviso no topo (permissão, GPS, erro, mapa vazio...) */}
      {aviso && (
        <View style={styles.aviso} accessibilityRole="alert">
          <Text style={styles.avisoTexto}>{aviso.texto}</Text>
          {aviso.acao && (
            <TouchableOpacity
              onPress={aviso.acao.aoPressionar}
              accessibilityRole="button"
              accessibilityLabel={aviso.acao.rotulo}
            >
              <Text style={styles.avisoAcao}>{aviso.acao.rotulo}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Botão lateral direito que abre a tela de busca */}
      <TouchableOpacity
        style={styles.botaoPesquisa}
        onPress={() => router.push('/buscar')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Abrir tela de busca de estabelecimentos"
      >
        <Ionicons name="search" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Botão "onde estou": volta a seguir o usuário e centraliza o mapa nele */}
      {posicao && (
        <TouchableOpacity
          style={[styles.botaoLocalizacao, seguindo && styles.botaoLocalizacaoAtivo]}
          onPress={() => setSeguindo(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: seguindo }}
          accessibilityLabel={
            seguindo
              ? 'O mapa está acompanhando a sua localização'
              : 'Centralizar o mapa na minha localização'
          }
        >
          <Ionicons name="locate" size={24} color={seguindo ? '#ffffff' : '#4338CA'} />
        </TouchableOpacity>
      )}

      {/* Card do local tocado no mapa, com nota e atalhos para ver detalhes e avaliar */}
      {pontoSelecionado && (
        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <View style={styles.cardTitulos}>
              <Text style={styles.cardTitulo}>{pontoSelecionado.nome}</Text>
              <Text style={styles.cardCategoria}>{pontoSelecionado.categoria}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelecionadoId(null)}
              accessibilityRole="button"
              accessibilityLabel="Fechar as informações do local"
              hitSlop={10}
            >
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardNota}>
            <EstrelasAvaliacao nota={pontoSelecionado.nota} tamanho={18} />
            <Text style={styles.cardNotaTexto}>
              {pontoSelecionado.totalAvaliacoes === 0
                ? 'Sem avaliações'
                : `${pontoSelecionado.nota.toString().replace('.', ',')} - ${pontoSelecionado.totalAvaliacoes} ${
                    pontoSelecionado.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'
                  }`}
            </Text>
          </View>

          <View style={styles.cardBotoes}>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() =>
                router.push({
                  pathname: '/estabelecimento/[estabelecimentoId]',
                  params: { estabelecimentoId: pontoSelecionado.id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Ver detalhes de ${pontoSelecionado.nome}`}
            >
              <Text style={styles.botaoSecundarioTexto}>Ver detalhes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoPrimario}
              onPress={() =>
                router.push({
                  pathname: '/estabelecimento/[estabelecimentoId]/avaliar',
                  params: { estabelecimentoId: pontoSelecionado.id, nome: pontoSelecionado.nome },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Avaliar ${pontoSelecionado.nome}`}
            >
              <Text style={styles.botaoPrimarioTexto}>Avaliar local</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const TOPO = Platform.OS === 'ios' ? 60 : 45;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  botaoPesquisa: {
    position: 'absolute',
    top: TOPO,
    right: 0,
    width: 60,
    height: 48,
    backgroundColor: '#b81d59',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botaoLocalizacao: {
    position: 'absolute',
    top: TOPO + 60,
    right: 0,
    width: 60,
    height: 48,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botaoLocalizacaoAtivo: {
    backgroundColor: '#4338CA',
  },
  aviso: {
    position: 'absolute',
    top: TOPO,
    left: 16,
    right: 76,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avisoTexto: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  avisoAcao: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338ca',
    textDecorationLine: 'underline',
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitulos: {
    flex: 1,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardCategoria: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  cardNota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNotaTexto: {
    fontSize: 14,
    color: '#0f172a',
  },
  cardBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  botaoSecundario: {
    flex: 1,
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#3b34c9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoSecundarioTexto: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3b34c9',
  },
  botaoPrimario: {
    flex: 1,
    height: 44,
    backgroundColor: '#fbc07a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoPrimarioTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
});
