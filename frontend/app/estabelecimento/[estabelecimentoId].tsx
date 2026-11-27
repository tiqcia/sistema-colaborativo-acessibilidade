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
import { Ionicons } from '@expo/vector-icons';
import { EstrelasAvaliacao } from '../../components/estrelasAvaliacao';
import { AvaliacaoCard, Avaliacao } from '../../components/avaliacaoCard';
import { BotaoVoltar } from '../../components/botaoVoltar';
import { AvaliacaoModal } from '../../components/avaliacaoModal';
import { api, mensagemDeErro } from '../../services/api';
import type { EstabelecimentoDetalhe } from '../../services/api';

export default function DetalhesEstabelecimentoScreen() {
  const { estabelecimentoId } = useLocalSearchParams<{ estabelecimentoId: string }>();

  const [abaAtiva, setAbaAtiva] = useState<'sobre' | 'avaliacoes'>('sobre');
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<Avaliacao | null>(null);

  // Dados vindos do servidor (antes eram valores de exemplo escritos no código)
  const [estabelecimento, setEstabelecimento] = useState<EstabelecimentoDetalhe | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  // Carrega os dados toda vez que a tela ganha foco. Assim, ao voltar da tela
  // "Avaliar local", a nova avaliação já aparece.
  useFocusEffect(
    useCallback(() => {
      let ativo = true; // evita atualizar a tela se ela já foi fechada

      async function carregarDados() {
        try {
          // As duas buscas acontecem ao mesmo tempo
          const [dados, lista] = await Promise.all([
            api.buscarEstabelecimento(estabelecimentoId),
            api.listarAvaliacoes(estabelecimentoId),
          ]);
          if (!ativo) return;
          setEstabelecimento(dados);
          setAvaliacoes(lista);
          setErro(null);
        } catch (e) {
          if (!ativo) return;
          setErro(mensagemDeErro(e));
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregarDados();
      return () => {
        ativo = false;
      };
    }, [estabelecimentoId, tentativa])
  );

  function tentarNovamente() {
    setCarregando(true);
    setErro(null);
    setTentativa((anterior) => anterior + 1);
  }

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b34c9" />
      </View>
    );
  }

  // Não conseguiu carregar e não há nada para mostrar: mensagem + botão de tentar de novo
  if (!estabelecimento) {
    return (
      <View style={[styles.container, styles.centralizado]}>
        <BotaoVoltar fallbackRoute="/buscar" style={styles.botaoVoltar} />
        <Text style={styles.mensagemErro}>
          {erro ?? 'Estabelecimento não encontrado.'}
        </Text>
        <TouchableOpacity
          style={styles.botaoTentar}
          onPress={tentarNovamente}
          accessibilityRole="button"
          accessibilityLabel="Tentar carregar novamente"
        >
          <Text style={styles.botaoTentarTexto}>Tentar novamente</Text>
        </TouchableOpacity>
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
          {estabelecimento.imagemUrl ? (
            <Image
              source={{ uri: estabelecimento.imagemUrl }}
              style={styles.headerImage}
            />
          ) : (
            // Ainda não há fotos no backend: mostra um ícone no lugar
            <View
              style={styles.headerSemImagem}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Ionicons name="business-outline" size={64} color="#94a3b8" />
            </View>
          )}
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
              {estabelecimento.totalAvaliacoes}{' '}
              {estabelecimento.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
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
            <Text style={styles.descricao}>
              {estabelecimento.descricao || 'Este local ainda não tem descrição.'}
            </Text>
          ) : (
            <View style={styles.avaliacoesLista}>
              {avaliacoes.length === 0 && (
                <Text style={styles.descricao}>
                  Ainda não há avaliações. Seja o primeiro a avaliar este local!
                </Text>
              )}
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
  headerSemImagem: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralizado: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  mensagemErro: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  botaoTentar: {
    backgroundColor: '#fbc07a',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  botaoTentarTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
});