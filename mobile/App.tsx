import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';

// Entry point: Redux Provider (global state) → SafeArea → Navigation.
// Firebase native modules read google-services.json / GoogleService-Info.plist
// at build time — no JS config needed here.
export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
