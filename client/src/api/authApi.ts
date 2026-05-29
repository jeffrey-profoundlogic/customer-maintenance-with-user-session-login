import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/auth',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export interface AuthUser {
  username: string;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const response = await api.post<AuthUser>('/login', { username, password });
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post('/logout');
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const response = await api.get<AuthUser>('/me');
    return response.data;
  } catch {
    return null;
  }
}
