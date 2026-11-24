import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { EstrelasAvaliacao } from './estrelasAvaliacao';

export interface EstabelecimentoResumo {
  id: string;
  nome: string;
  descricao: string;
  nota: number;
}

interface EstabelecimentoCardProps {
  estabelecimento: EstabelecimentoResumo;
}

export function EstabelecimentoCard({
  estabelecimento,
}: EstabelecimentoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitulo}>{estabelecimento.nome}</Text>
        <EstrelasAvaliacao nota={estabelecimento.nota} tamanho={18} />
      </View>

      <Text style={styles.cardDescricao}>{estabelecimento.descricao}</Text>

      <TouchableOpacity
        style={styles.verMaisBtn}
        onPress={() =>
          router.push({
            pathname: '/estabelecimento/[estabelecimentoId]',
            params: { estabelecimentoId: estabelecimento.id },
          })
        }
        accessibilityRole="link"
        accessibilityLabel={`Ver mais detalhes sobre ${estabelecimento.nome}`}
      >
        <Text style={styles.verMaisTexto}>Ver mais</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 345,
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  cardDescricao: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  verMaisBtn: {
    alignSelf: 'flex-end',
  },
  verMaisTexto: {
    fontSize: 14,
    color: '#4338ca',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});