import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAppDispatch } from '../../hooks/hooks';
import { setAuthError } from '../../store/authSlice';
import { isValidEmail } from '../../utils/validation';

// Email/password login via Firebase Auth (client SDK). The backend is NOT
// involved here — it only sees the ID token later on API calls.
export function LoginScreen({ navigation }: { navigation: { navigate: (s: string) => void } }) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      // onAuthStateChanged listener in App.tsx picks up the session.
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      setError(msg);
      dispatch(setAuthError(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TaskFlow — Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={busy ? 'Logging in…' : 'Login'} onPress={submit} disabled={busy} />
      <View style={styles.gap} />
      <Button title="No account? Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  error: { color: '#d32f2f', marginBottom: 10, textAlign: 'center' },
  gap: { height: 10 },
});
