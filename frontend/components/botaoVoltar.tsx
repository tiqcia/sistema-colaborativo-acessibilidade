import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';

interface BotaoVoltarProps {
  fallbackRoute?: Href;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function BotaoVoltar({
  fallbackRoute = '/(tabs)',
  style,
  accessibilityLabel = 'Voltar para a tela anterior',
}: BotaoVoltarProps) {
  function handleVoltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.botao, style]}
      onPress={handleVoltar}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="arrow-back" size={22} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
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
});