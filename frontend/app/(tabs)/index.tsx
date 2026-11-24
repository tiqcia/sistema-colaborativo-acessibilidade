import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function MapaScreen() {
  return (
    <View style={styles.container}>

      <View style={styles.mapaPlaceholder} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  mapaPlaceholder: {
    flex: 1,
  },
  botaoPesquisa: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
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
});