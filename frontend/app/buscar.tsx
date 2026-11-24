import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BotaoVoltar } from '../components/botaoVoltar';
import {
  EstabelecimentoCard,
  EstabelecimentoResumo,
} from '../components/estabelecimentoCard';

const ESTABELECIMENTOS_MOCK: EstabelecimentoResumo[] = [
  {
    id: '1',
    nome: "McDonald's",
    descricao:
      'Rede de fast-food tradicional conhecida por ter ótimos hambúrgueres e batatas fritas.',
    nota: 4.2,
  },
];

export default function BuscarScreen() {
  const [busca, setBusca] = useState('');

  const resultados = ESTABELECIMENTOS_MOCK.filter((item) =>
    item.nome.toLowerCase().includes(busca.toLowerCase())
  );

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
});