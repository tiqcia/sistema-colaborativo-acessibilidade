import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FDBA74',
        tabBarInactiveTintColor: '#FAFAFA',
        tabBarStyle: {
          backgroundColor: '#4338CA',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: Platform.OS === 'ios' ? 84 : 80,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="cadastrarEst"
        options={{
          title: 'Adicionar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={26}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              size={24}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}