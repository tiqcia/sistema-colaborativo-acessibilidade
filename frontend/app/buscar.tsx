import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BotaoVoltar } from '../components/botaoVoltar';
import {
  EstabelecimentoCard,
  EstabelecimentoResumo,
} from '../components/estabelecimentoCard';
import { api, mensagemDeErro } from '../services/api';

// Deixa o texto em minúsculas e sem acentos: digitar "cafe" encontra "Café".
function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function BuscarScreen() {
  const [busca, setBusca] = useState('');

  // Dados vindos do servidor (antes era a lista ESTABELECIMENTOS_MOCK)
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  // Busca a lista no servidor toda vez que a tela ganha foco
  // (assim, um local recém-cadastrado já aparece aqui).
  useFocusEffect(
    useCallback(() => {
      let ativo = true; // evita atualizar a tela se ela já foi fechada

      async function carregarLista() {
        try {
          const lista = await api.listarEstabelecimentos();
          if (!ativo) return;
          setEstabelecimentos(lista);
          setErro(null);
        } catch (e) {
          if (!ativo) return;
          setErro(mensagemDeErro(e));
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregarLista();
      return () => {
        ativo = false;
      };
    }, [tentativa])
  );

  function tentarNovamente() {
    setCarregando(true);
    setErro(null);
    setTentativa((anterior) => anterior + 1);
  }

  const termo = normalizar(busca.trim());
  const resultados = estabelecimentos.filter((item) =>
    normalizar(item.nome).includes(termo)
  );

  // O que aparece quando a lista está vazia: carregando, erro ou "nada encontrado"
  function renderVazio() {
    if (carregando) {
      return (
        <ActivityIndicator
          style={styles.carregando}
          size="large"
          color="#3b34c9"
          accessibilityLabel="Carregando estabelecimentos"
        />
      );
    }

    if (erro) {
      return (
        <View style={styles.mensagemBox}>
          <Text style={styles.mensagemTexto}>{erro}</Text>
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
      <View style={styles.mensagemBox}>
        <Text style={styles.mensagemTexto}>
          {busca.trim()
            ? 'Nenhum estabelecimento encontrado para essa busca.'
            : 'Nenhum estabelecimento cadastrado ainda.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão circular de voltar */}
      <BotaoVoltar
        fallbackRoute="/(tabs)"
        style={{ alignSelf: 'flex-start', marginBottom: 8 }}
        accessibilityLabel="Voltar para o mapa"
      />

      {/* Título centralizado */}
      <Text style={styles.titulo}>{'Busque por um\nestabelecimento'}</Text>

      {/* Barra de pesquisa arredondada */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#475569"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Digite o nome do local..."
          placeholderTextColor="#94a3b8"
          value={busca}
          onChangeText={setBusca}
          autoFocus
          accessibilityLabel="Campo de busca por estabelecimento"
        />
        {busca.length > 0 && (
          <TouchableOpacity
            onPress={() => setBusca('')}
            accessibilityRole="button"
            accessibilityLabel="Limpar texto da busca"
          >
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Cards de Resultado */}
      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listaContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderVazio}
        renderItem={({ item }) => (
          <EstabelecimentoCard estabelecimento={item} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 28,
  },
  searchContainer: {
    width: 345,
    maxWidth: '100%',
    height: 46,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  listaContainer: {
    width: 345,
    maxWidth: '100%',
    paddingBottom: 20,
    alignItems: 'center',
  },
  carregando: {
    marginTop: 30,
  },
  mensagemBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  mensagemTexto: {
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