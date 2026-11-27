import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { api, mensagemDeErro } from '../../services/api';

const OPCOES_CATEGORIA = [
  'Restaurante',
  'Lanchonete',
  'Cafeteria',
  'Hotel',
  'Shopping',
  'Cinema',
  'Teatro',
  'Farmácia',
  'Loja',
  'Órgão Público',
  'Clínica',
  'Parque',
  'Praça',
  'Museu',
  'Igreja'
];

export default function CadastrarScreen() {
  const [nomeLocal, setNomeLocal] = useState('');
  const [endereco, setEndereco] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);

  const [aberto, setAberto] = useState(false);

  const [enviando, setEnviando] = useState(false);

  function selecionarAssunto(item: string) {
    setAssunto(item);
    setAberto(false);
  }

  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à sua galeria para adicionar uma foto.'
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      setImagemUri(resultado.assets[0].uri);
    }
  }

  async function handleSalvar() {
  if (!nomeLocal.trim() || !endereco.trim() || !assunto) {
    const msg = 'Preencha todos os campos obrigatórios (*).';
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Atenção', msg);
    return;
  }

  try {
    setEnviando(true);

    const formData = new FormData();
    formData.append('nome', nomeLocal.trim());
    formData.append('endereco', endereco.trim());
    formData.append('categoria', assunto);
    if (descricao.trim()) {
      formData.append('observacoes', descricao.trim());
    }

    // FOTOS (futuro): o backend ainda não guarda imagens, então a foto escolhida
    // NÃO é enviada por enquanto (enviar só gastaria rede, e uma foto grande demais
    // faria o cadastro falhar). Quando o backend tiver fotos, reative este bloco:
    //
    // if (imagemUri) {
    //   const nomeArquivo = imagemUri.split('/').pop() || 'foto.jpg';
    //   const tipo = nomeArquivo.endsWith('.png') ? 'image/png' : 'image/jpeg';
    //   formData.append('imagem', {
    //     uri: imagemUri,
    //     name: nomeArquivo,
    //     type: tipo,
    //   } as any);
    // }

    // Envia para o servidor
    const resposta = await api.criarEstabelecimento(formData);

    // Deu certo: limpa o formulário e abre a página do local recém-cadastrado
    setNomeLocal('');
    setEndereco('');
    setAssunto('');
    setDescricao('');
    setImagemUri(null);

    router.push({
      pathname: '/estabelecimento/[estabelecimentoId]',
      params: { estabelecimentoId: resposta.id },
    });
  } catch (error) {
    const msg = `Não foi possível cadastrar o estabelecimento. ${mensagemDeErro(error)}`;
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
  } finally {
    setEnviando(false);
  }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.uploadGroup}>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={escolherImagem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Adicione uma imagem"
          >
            {imagemUri ? (
              <Image source={{ uri: imagemUri }} style={styles.imagemPreview} />
            ) : (
              <Ionicons name="share-outline" size={50} color="#4338ca" />
            )}
          </TouchableOpacity>

          <Text style={styles.uploadLegenda}>
            {imagemUri ? 'Toque na imagem para alterar' : 'Adicione uma imagem'}
          </Text>
        </View>

        {/* Nome */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do estabelecimento *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Café Central"
            placeholderTextColor="#94a3b8"
            value={nomeLocal}
            onChangeText={setNomeLocal}
            accessibilityLabel="nome do estabelecimento"
          />
        </View>

        {/* Endereço */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Rua Sergipe, 500"
            placeholderTextColor="#94a3b8"
            value={endereco}
            onChangeText={setEndereco}
            accessibilityLabel="endereço do estabelecimento"
          />
        </View>

        {/* Categoria */}
        <View style={[styles.inputGroup, styles.dropdownGroup]}>
          <Text style={styles.label}>Categoria *</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, aberto && styles.dropdownButtonAberto]}
            onPress={() => setAberto(!aberto)}
            accessibilityRole="combobox"
            accessibilityState={{ expanded: aberto }}
            accessibilityLabel="Selecionar categoria do estabelecimento"
          >
            <Text style={assunto ? styles.dropdownText : styles.placeholderText}>
              {assunto || 'Selecione uma opção'}
            </Text>
            <Ionicons
              name={aberto ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>

          {aberto && (
            <View style={styles.dropdownLista}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                {OPCOES_CATEGORIA.map((item, index) => {
                  const selecionado = assunto === item;
                  const ultimoItem = index === OPCOES_CATEGORIA.length - 1;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.opcaoItem,
                        selecionado && styles.opcaoSelecionada,
                        !ultimoItem && styles.opcaoComBorda,
                      ]}
                      onPress={() => selecionarAssunto(item)}
                    >
                      <Text
                        style={[
                          styles.opcaoTexto,
                          selecionado && styles.opcaoTextoSelecionado,
                        ]}
                      >
                        {item}
                      </Text>
                      {selecionado && (
                        <Ionicons name="checkmark" size={18} color="#1d4ed8" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Descrição */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição"
            placeholderTextColor="#94a3b8"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.botaoSalvar, enviando && styles.botaoDesabilitado]}
          onPress={handleSalvar}
          disabled={enviando}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Salvar informações do estabelecimento"
        >
          <Text style={styles.botaoSalvarTexto}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 120, 
    backgroundColor: '#FAFAFA',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', 
  },
  inputGroup: {
    marginBottom: 20, 
    width: 345,
    maxWidth: '100%',
  },
  dropdownGroup: {
    zIndex: 1000,
    elevation: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 8,
  },
  input: {
    width: 345,
    maxWidth: '100%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#71717A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#18181B',
  },
  textArea: {
    minHeight: 130, 
  },
  dropdownButton: {
    width: 345,
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#71717A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonAberto: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: '#71717A',
  },
  dropdownText: {
    fontSize: 16,
    color: '#52525B',
  },
  placeholderText: {
    fontSize: 16,
    color: '#52525B',
  },
  dropdownLista: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#71717A',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  opcaoItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opcaoComBorda: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  opcaoSelecionada: {
    backgroundColor: '#eff6ff',
  },
  opcaoTexto: {
    fontSize: 15,
    color: '#52525B',
  },
  opcaoTextoSelecionado: {
    color: '#4338CA',
    fontWeight: '600',
  },
  uploadGroup: {
    width: 345,
    maxWidth: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadBox: {
    width: 345,
    maxWidth: '100%',
    height: 180, 
    borderWidth: 1.5,
    borderColor: '#4338CA',
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagemPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadLegenda: {
    marginTop: 8,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },

  botaoSalvar: {
    width: 345,
    maxWidth: '100%',
    backgroundColor: '#4338CA',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, 
    marginBottom: 20,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoSalvarTexto: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: 'bold',
  },

});