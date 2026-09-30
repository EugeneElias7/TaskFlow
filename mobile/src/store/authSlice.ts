import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Minimal auth state: Firebase owns the session; Redux only mirrors
// what the UI needs (user id/email + loading/error flags).
interface AuthState {
  uid: string | null;
  email: string | null;
  initializing: boolean;
  error: string | null;
}

const initialState: AuthState = {
  uid: null,
  email: null,
  initializing: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ uid: string; email: string | null } | null>) {
      state.uid = action.payload?.uid ?? null;
      state.email = action.payload?.email ?? null;
      state.initializing = false;
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.initializing = false;
    },
    signOutLocal(state) {
      state.uid = null;
      state.email = null;
    },
  },
});

export const { setUser, setAuthError, signOutLocal } = authSlice.actions;
export default authSlice.reducer;
