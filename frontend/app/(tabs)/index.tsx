import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Alert, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { api, mensagemDeErro, EstabelecimentoMapa } from '../../services/api';

export default function MapaScreen() {
  const [locUsuario, setLocUsuario] = useState<Location.LocationObject | null>(null);
  const [locais, setLocais] = useState<EstabelecimentoMapa[]>([]);
  const [selecionado, setSelecionado] = useState<EstabelecimentoMapa | null>(null);
  async function carregarPins() { try { setLocais(await api.listarNoMapa()); } catch (e) { Alert.alert('Erro', mensagemDeErro(e)); } }
  useEffect(() => {
    carregarPins();
    (async () => {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) { Alert.alert('Localização', 'Permita o acesso à localização para mostrar sua posição.'); return; }
      setLocUsuario(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    })();
  }, []);
  async function reposicionar(evento: MapPressEvent) {
    if (!selecionado) return;
    const { latitude, longitude } = evento.nativeEvent.coordinate;
    try {
      await api.definirLocalizacao(selecionado.id, latitude, longitude);
      Alert.alert('Localização salva', `Pin de ${selecionado.nome} atualizado.`);
      setSelecionado(null); carregarPins();
    } catch (e) { Alert.alert('Erro', mensagemDeErro(e)); }
  }
  const regiao = locUsuario ? { latitude: locUsuario.coords.latitude, longitude: locUsuario.coords.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 } :
    { latitude: -23.3045, longitude: -51.1696, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  return <View style={styles.container}>
    <MapView style={styles.mapa} initialRegion={regiao} showsUserLocation showsMyLocationButton onLongPress={reposicionar}>
      {locais.filter(local => local.latitude !== null && local.longitude !== null).map(local => <Marker key={local.id} coordinate={{ latitude: local.latitude!, longitude: local.longitude! }} title={local.nome} description={local.endereco} onPress={() => setSelecionado(local)} />)}
    </MapView>
    {locais.some(l => l.latitude === null || l.longitude === null) && <View style={styles.listaSemPin}>
      <Text style={{fontWeight: '600'}}>Estabelecimentos sem localização:</Text>
      {locais.filter(l => l.latitude === null || l.longitude === null).slice(0,4).map(l => <TouchableOpacity key={l.id} onPress={() => setSelecionado(l)}><Text style={styles.fechar}>{l.nome} — selecionar</Text></TouchableOpacity>)}
    </View>}
    {selecionado && <View style={styles.painel}>
      <Text style={styles.nome}>{selecionado.nome}</Text><Text>{selecionado.endereco}</Text>
      <TouchableOpacity style={styles.botaoDetalhe} onPress={() => router.push(`/estabelecimento/${selecionado.id}` as any)}><Text style={styles.botaoTexto}>Ver avaliações</Text></TouchableOpacity>
      <Text style={styles.instrucao}>Pressione o mapa por alguns segundos para mover este pin.</Text>
      <TouchableOpacity onPress={() => setSelecionado(null)}><Text style={styles.fechar}>Fechar</Text></TouchableOpacity>
    </View>}
    <TouchableOpacity style={styles.botaoPesquisa} onPress={() => router.push('/buscar')}><Ionicons name="search" size={24} color="#fff" /></TouchableOpacity>
    <TouchableOpacity style={styles.botaoAtualizar} onPress={carregarPins}><Ionicons name="refresh" size={22} color="#fff" /></TouchableOpacity>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' }, mapa: { flex: 1 },
  botaoPesquisa: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 45, right: 0, width: 60, height: 48, backgroundColor: '#b81d59', borderTopLeftRadius: 16, borderBottomLeftRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  botaoAtualizar: { position: 'absolute', top: Platform.OS === 'ios' ? 120 : 105, right: 12, width: 48, height: 48, borderRadius: 24, backgroundColor: '#4338ca', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  listaSemPin: { position: 'absolute', top: Platform.OS === 'ios' ? 170 : 150, left: 12, right: 70, padding: 10, backgroundColor: 'white', borderRadius: 12, maxHeight: 150 },
  painel: { position: 'absolute', bottom: 20, left: 16, right: 16, padding: 16, borderRadius: 16, backgroundColor: 'white', elevation: 8 },
  nome: { fontSize: 18, fontWeight: '700', marginBottom: 6 }, botaoDetalhe: { marginTop: 12, backgroundColor: '#4338ca', padding: 12, borderRadius: 10, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600' }, instrucao: { marginTop: 8, color: '#475569' }, fechar: { marginTop: 12, color: '#4338ca', textAlign: 'right' },
});
