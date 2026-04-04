import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { LocationCaptureScreen } from './src/screens/LocationCaptureScreen';
import { AlertSendingScreen } from './src/screens/AlertSendingScreen';
import { ConfirmationScreen } from './src/screens/ConfirmationScreen';
import { WitnessScreen } from './src/screens/WitnessScreen';
import { VoiceDetectionScreen } from './src/screens/VoiceDetectionScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';

// Import Theme/Data
import { theme } from './src/constants/theme';
import { MOCK_CONTACTS } from './src/constants/mockData';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Mock Tab Screens
const ContactsScreen = () => (
  <View style={tabStyles.container}>
    <Text style={tabStyles.title}>Emergency Contacts</Text>
    {MOCK_CONTACTS.map((c, i) => (
      <View key={i} style={tabStyles.card}>
        <Text style={tabStyles.name}>{c.name}</Text>
        <Text style={tabStyles.phone}>{c.phone}</Text>
      </View>
    ))}
  </View>
);


const SettingsScreen = () => (
  <View style={tabStyles.container}>
    <Text style={tabStyles.title}>Settings</Text>
    <View style={tabStyles.card}>
      <Text style={tabStyles.name}>Fall Detection</Text>
      <Text style={tabStyles.phone}>Enabled ✅</Text>
    </View>
  </View>
);

const tabStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.large },
  title: { color: theme.colors.textPrimary, fontSize: theme.typography.sizes.heading, fontWeight: 'bold', marginBottom: theme.spacing.xl, marginTop: theme.spacing.xl },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.large, borderRadius: theme.borderRadius.card, marginBottom: theme.spacing.medium },
  name: { color: theme.colors.textPrimary, fontSize: theme.typography.sizes.subtitle, fontWeight: 'bold' },
  phone: { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }
});

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Contacts') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen name="LocationCapture" component={LocationCaptureScreen} />
          <Stack.Screen name="AlertSending" component={AlertSendingScreen} />
          <Stack.Screen name="ConfirmationScreen" component={ConfirmationScreen} />
          <Stack.Screen name="WitnessScreen" component={WitnessScreen} />
          <Stack.Screen name="VoiceDetectionScreen" component={VoiceDetectionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
