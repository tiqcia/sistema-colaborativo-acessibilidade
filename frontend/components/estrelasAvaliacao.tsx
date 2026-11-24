import { View, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

interface estrelasAvaliacao {
  nota: number;
  tamanho?: number;
  corPreenchida?: string;
  onChangeNota?: (novaNota: number) => void;
}

export function EstrelasAvaliacao({
  nota,
  tamanho = 18,
  corPreenchida = '#f59e0b',
  onChangeNota,
}: estrelasAvaliacao) {
  const estrelasCheias = Math.floor(nota);

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((index) => {
        const preenchida = index <= estrelasCheias;

        const estrelaVisual = (
          <View
            key={index}
            style={[styles.wrapper, { width: tamanho + 2, height: tamanho + 2 }]}
          >
            {preenchida && (
              <FontAwesome5
                name="star"
                solid
                size={tamanho}
                color={corPreenchida}
                style={styles.preenchida}
              />
            )}
            <FontAwesome5 name="star" size={tamanho} color="black" />
          </View>
        );

        if (onChangeNota) {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onChangeNota(index)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${index} ${index === 1 ? 'estrela' : 'estrelas'}`}
            >
              {estrelaVisual}
            </TouchableOpacity>
          );
        }

        return estrelaVisual;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preenchida: {
    position: 'absolute',
  },
});