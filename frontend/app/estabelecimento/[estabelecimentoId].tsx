import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { EstrelasAvaliacao } from '../../components/estrelasAvaliacao';
import { AvaliacaoCard, Avaliacao } from '../../components/avaliacaoCard';
import { BotaoVoltar } from '../../components/botaoVoltar';
import { AvaliacaoModal } from '../../components/avaliacaoModal';

const AVALIACOES_MOCK: Avaliacao[] = [
  {
    id: '1',
    autor: 'Fulano',
    data: 'há 2 dias',
    nota: 4,
    titulo: 'Entrada ok, banheiro não',
    comentario:
      'A rampa da entrada é larga e tem corrimão. Dentro, o salão tem espaço para cadeira de rodas, mas o banheiro adaptado estava interditado para manutenção durante toda a tarde.',
  },
  {
    id: '2',
    autor: 'Usuário Anônimo',
    data: 'há 1 semana',
    nota: 5,
    titulo: 'Ótimo atendimento e acesso',
    comentario:
      'Bom espaço entre as mesas para circulação de cadeira de rodas e cardápio de fácil leitura.',
  },
];

export default function DetalhesEstabelecimentoScreen() {
  const { estabelecimentoId } = useLocalSearchParams<{ estabelecimentoId: string }>();

  const [abaAtiva, setAbaAtiva] = useState<'sobre' | 'avaliacoes'>('sobre');
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<Avaliacao | null>(null);

  const [estabelecimento, setEstabelecimento] = useState({
    estabelecimentoId,
    nome: "McDonald's",
    categoria: 'Lanchonete',
    endereco: 'R. Miguel Couto, 67 - Jardim Shangri-Lá',
    notaMedia: 4.2,
    totalAvaliacoes: 38,
    descricao:
      'Rede de fast-food tradicional conhecida por ter ótimos hambúrgueres e batatas fritas.',
    imagemUrl:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
  });
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(AVALIACOES_MOCK);
  const [carregando, setCarregando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function carregarDados() {
        try {
          setCarregando(true);
        } finally {
          setCarregando(false);
        }
      }

      carregarDados();
    }, [estabelecimentoId])
  );

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b34c9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerImageContainer}>
          <Image
            source={{ uri: estabelecimento.imagemUrl }}
            style={styles.headerImage}
          />
          <BotaoVoltar
            fallbackRoute="/buscar"
            style={styles.botaoVoltar}
          />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.titulo}>{estabelecimento.nome}</Text>
          <Text style={styles.subtitulo}>
            {estabelecimento.categoria} - {estabelecimento.endereco}
          </Text>

          {/* Nota e Total de Avaliações */}
          <View style={styles.ratingContainer}>
            <EstrelasAvaliacao nota={estabelecimento.notaMedia} tamanho={20} />
            <Text style={styles.ratingText}>
              {estabelecimento.notaMedia.toString().replace('.', ',')} -{' '}
              {estabelecimento.totalAvaliacoes} avaliações
            </Text>
          </View>

          {/* Seletor de Abas ("Sobre" | "Avaliações") */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabItem, abaAtiva === 'sobre' && styles.tabItemAtiva]}
              onPress={() => setAbaAtiva('sobre')}
              accessibilityRole="tab"
              accessibilityState={{ selected: abaAtiva === 'sobre' }}
            >
              <Text
                style={[
                  styles.tabTexto,
                  abaAtiva === 'sobre' && styles.tabTextoAtivo,
                ]}
              >
                Sobre
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                abaAtiva === 'avaliacoes' && styles.tabItemAtiva,
              ]}
              onPress={() => setAbaAtiva('avaliacoes')}
              accessibilityRole="tab"
              accessibilityState={{ selected: abaAtiva === 'avaliacoes' }}
            >
              <Text
                style={[
                  styles.tabTexto,
                  abaAtiva === 'avaliacoes' && styles.tabTextoAtivo,
                ]}
              >
                Avaliações
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo Dinâmico da Aba Selecionada */}
          {abaAtiva === 'sobre' ? (
            <Text style={styles.descricao}>{estabelecimento.descricao}</Text>
          ) : (
            <View style={styles.avaliacoesLista}>
              {/* 3. Agora renderiza o estado "avaliacoes" em vez do mock direto */}
              {avaliacoes.map((av) => (
                <AvaliacaoCard
                  key={av.id}
                  avaliacao={av}
                  onVerMais={(item) => setAvaliacaoSelecionada(item)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botão Inferior "Avaliar local" */}
      <View style={styles.footerAction}>
        <TouchableOpacity
          style={styles.botaoAvaliar}
          onPress={() =>
            router.push({
              pathname: '/estabelecimento/[estabelecimentoId]/avaliar',
              params: {
                estabelecimentoId: String(estabelecimentoId),
                nome: estabelecimento.nome,
              },
            })
          }
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Avaliar local"
        >
          <Text style={styles.botaoAvaliarTexto}>Avaliar local</Text>
        </TouchableOpacity>
      </View>

      <AvaliacaoModal
        visible={avaliacaoSelecionada !== null}
        avaliacao={avaliacaoSelecionada}
        onClose={() => setAvaliacaoSelecionada(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerImageContainer: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  botaoVoltar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 38,
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  ratingText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '400',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginBottom: 18,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabItemAtiva: {
    borderBottomColor: '#b81d59',
  },
  tabTexto: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
  },
  tabTextoAtivo: {
    color: '#b81d59',
    fontWeight: '700',
  },
  descricao: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  avaliacoesLista: {
    gap: 12,
  },
  footerAction: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  botaoAvaliar: {
    width: 345,
    maxWidth: '90%',
    height: 48,
    backgroundColor: '#fbc07a',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  botaoAvaliarTexto: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1e293b',
  },
});