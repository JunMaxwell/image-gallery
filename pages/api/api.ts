import axios from 'axios';
import { GetServerSidePropsContext } from 'next';
import { getSession } from 'next-auth/react';
import { ApiResponse } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const api = axios.create({
  baseURL: API_URL,
});

type UserResponse = {
  id: number;
  name: string;
  email: string;
  access_token: string;
}

export const createApiClient = (context?: GetServerSidePropsContext) => {
  const api = axios.create({
    baseURL: API_URL,
  });

  api.interceptors.request.use(async (config) => {
    let session;
    if (context) {
      session = await getSession(context);
    } else {
      session = await getSession();
    }
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return config;
  });

  return api;
};

export const login = async (email: string, password: string): Promise<UserResponse> => {
  try {
    const response: ApiResponse<UserResponse> = await api.post('/auth/login', { email, password });
    if (response.data && response.data.access_token) {
      return response.data;
    } else {
      console.error('Unexpected login response:', response.data);
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Login error response:', error.response.data);
      throw new Error(error.response.data.message || 'Authentication failed');
    }
    console.error('Login error:', error);
    throw new Error('An unexpected error occurred');
  }
};

export const logout = async () => {
  const api = createApiClient();
  await api.post('/auth/logout');
}

export const getImages = async (context?: GetServerSidePropsContext) => {
  const api = createApiClient(context);
  const response = await api.get('/images');
  return response.data;
};

export const addComment = async (imageId: number, text: string, context?: GetServerSidePropsContext) => {
  const api = createApiClient(context);
  const response = await api.post(`/images/${imageId}/comments`, { text });
  return response.data;
};

// Add other API calls here as needed

export default createApiClient;