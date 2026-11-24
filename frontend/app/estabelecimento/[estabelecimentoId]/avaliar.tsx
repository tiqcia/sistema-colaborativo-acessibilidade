import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BotaoVoltar } from '../../../components/botaoVoltar';
import { EstrelasAvaliacao } from '../../../components/estrelasAvaliacao';

export default function AvaliarEstabelecimentoScreen() {
  const { estabelecimentoId, nome } = useLocalSearchParams<{
  estabelecimentoId: string;
  nome?: string;
  }>();

  const [nota, setNota] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [comentario, setComentario] = useState('');

  const [enviando, setEnviando] = useState(false);

  async function handleEnviarAvaliacao() {
    if (nota === 0) {
      const msg = 'Selecione uma nota de 1 a 5 estrelas.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Atenção', msg);
      return;
    }

    if (!comentario.trim()) {
      const msg = 'Escreva um breve relato sobre a acessibilidade do local.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Atenção', msg);
      return;
    }

    try {
      setEnviando(true);
      const novaAvaliacao = {
        estabelecimentoId,
        nota,
        titulo: titulo.trim() || undefined,
        comentario: comentario.trim(),
      };

      console.log('Avaliação enviada:', novaAvaliacao);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/estabelecimento/${estabelecimentoId}` as any);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Botão Voltar reutilizado */}
        <BotaoVoltar
          fallbackRoute={`/estabelecimento/${estabelecimentoId}` as any}
          style={styles.botaoVoltar}
          accessibilityLabel="Voltar para os detalhes do estabelecimento"
        />

        {/* Cabeçalho */}
        <Text style={styles.titulo}>Avaliar local</Text>
        <Text style={styles.subtitulo}>
          {nome || "McDonald's"}
        </Text>

        {/* Seletor de Nota */}
        <View style={styles.ratingBox}>
          <Text style={styles.labelCentral}>
            Como você avalia a acessibilidade?
          </Text>
          <EstrelasAvaliacao nota={nota} onChangeNota={setNota} tamanho={36} />
        </View>

        {/* Campo Título (Resumo) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Resumo da experiência (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Entrada com rampa, banheiro adaptado..."
            placeholderTextColor="#94a3b8"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={80}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relato detalhado *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Conte detalhes sobre rampas, largura das portas, piso tátil, atendimento..."
            placeholderTextColor="#94a3b8"
            value={comentario}
            onChangeText={setComentario}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Botão Confirmar */}
        <TouchableOpacity
          style={styles.botaoEnviar}
          onPress={handleEnviarAvaliacao}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Publicar avaliação"
        >
          <Text style={styles.botaoEnviarTexto}>Publicar avaliação</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  botaoVoltar: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 26,
  },
  ratingBox: {
    width: '100%',
    maxWidth: 345,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 22,
  },
  labelCentral: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 14,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    maxWidth: 345,
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 46,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  botaoEnviar: {
    width: '100%',
    maxWidth: 345,
    height: 48,
    backgroundColor: '#fbc07a',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  botaoEnviarTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
});