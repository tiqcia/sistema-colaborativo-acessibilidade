import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EstrelasAvaliacao } from './estrelasAvaliacao';

export interface Avaliacao {
  id: string;
  autor: string;
  nota: number;
  titulo?: string;
  comentario: string;
  data?: string;
}

interface AvaliacaoCardProps {
  avaliacao: Avaliacao;
  onVerMais?: (avaliacao: Avaliacao) => void;
}

export function AvaliacaoCard({ avaliacao, onVerMais }: AvaliacaoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.autorInfo}>
          <Text style={styles.autor}>{avaliacao.autor}</Text>
          {avaliacao.data && <Text style={styles.data}>{avaliacao.data}</Text>}
        </View>

        <EstrelasAvaliacao nota={avaliacao.nota} tamanho={16} />
      </View>

      {avaliacao.titulo && (
        <Text style={styles.titulo}>{avaliacao.titulo}</Text>
      )}

      <Text style={styles.comentario} numberOfLines={3}>
        {avaliacao.comentario}
      </Text>

      {onVerMais && (
        <TouchableOpacity
          style={styles.verMaisBtn}
          onPress={() => onVerMais(avaliacao)}
          accessibilityRole="button"
          accessibilityLabel={`Ver mais detalhes da avaliação de ${avaliacao.autor}`}
        >
          <Text style={styles.verMaisTexto}>Ver mais</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  autorInfo: {
    flex: 1,
    marginRight: 8,
  },
  autor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  data: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  comentario: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  verMaisBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  verMaisTexto: {
    fontSize: 13,
    color: '#4338ca',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});