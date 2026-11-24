import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { EstrelasAvaliacao } from './estrelasAvaliacao';
import { Avaliacao } from './avaliacaoCard';

interface AvaliacaoModalProps {
  visible: boolean;
  avaliacao: Avaliacao | null;
  onClose: () => void;
}

export function AvaliacaoModal({
  visible,
  avaliacao,
  onClose,
}: AvaliacaoModalProps) {
  if (!avaliacao) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.autor}>{avaliacao.autor}</Text>
            {avaliacao.data && <Text style={styles.data}>{avaliacao.data}</Text>}
          </View>

          <View style={styles.estrelasContainer}>
            <EstrelasAvaliacao nota={avaliacao.nota} tamanho={28} />
          </View>

          <ScrollView
            style={styles.textoScroll}
            showsVerticalScrollIndicator={false}
          >
            {avaliacao.titulo && (
              <Text style={styles.titulo}>{avaliacao.titulo}</Text>
            )}
            <Text style={styles.comentario}>{avaliacao.comentario}</Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.botaoFechar}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Fechar detalhes da avaliação"
          >
            <Text style={styles.botaoFecharTexto}>Fechar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    marginBottom: 14,
  },
  autor: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0f172a',
  },
  data: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  estrelasContainer: {
    marginBottom: 20,
  },
  textoScroll: {
    marginBottom: 24,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  comentario: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
  botaoFechar: {
    alignSelf: 'center',
    width: '80%',
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#3b34c9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoFecharTexto: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b34c9',
  },
});