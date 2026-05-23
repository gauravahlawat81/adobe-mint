import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'adobe_mint_session';

export interface Session {
  token: string;
  email: string;
  name: string;
  id: string;
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
