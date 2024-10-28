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

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers['Authorization'] = `Bearer ${session.accessToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

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
  await api.post('/auth/logout');
}

export const getImages = async () => {
  const response = await api.get('/images');
  return response.data;
};

export const addComment = async (imageId: number, text: string) => {
  const response = await api.post(`/images/${imageId}/comments`, { text });
  return response.data;
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const session = await getSession();
    if (!session?.accessToken || !session.user?.id) {
      throw new Error('Not authenticated');
    }

    formData.append('userId', session.user.id.toString());
    const response = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};
