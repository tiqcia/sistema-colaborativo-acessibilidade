import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="buscar" />
      <Stack.Screen name="estabelecimento/[estabelecimentoId]" />
      <Stack.Screen name="estabelecimento/[estabelecimentoId]/avaliar" />
    </Stack>
  );
}