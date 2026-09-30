import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { setUser } from '../store/authSlice';
import { setIdToken } from '../services/authToken';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { TaskListScreen } from '../screens/tasks/TaskListScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

// Root navigator: shows Auth stack when logged out, Tasks stack when logged in.
// The Firebase onAuthStateChanged listener is the single source of truth for
// session state; it also caches a fresh ID token for API calls.
export function AppNavigator() {
  const dispatch = useAppDispatch();
  const { uid, initializing } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          setIdToken(await user.getIdToken());
        } catch {
          setIdToken(null);
        }
        dispatch(setUser({ uid: user.uid, email: user.email ?? null }));
      } else {
        setIdToken(null);
        dispatch(setUser(null));
      }
    });
    return unsub;
  }, [dispatch]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {uid ? (
          <Stack.Screen name="Tasks" component={TaskListScreen} options={{ title: 'TaskFlow' }} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
