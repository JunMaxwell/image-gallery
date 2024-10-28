import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { login } from '../api';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const response = await login(credentials.email, credentials.password);
          if (response.access_token) {
            // Return the user object with the access token
            return { 
              id: response.id || 'user_id',  // Adjust this based on your backend response
              email: credentials.email,
              name: response.name || credentials.email,
              access_token: response.access_token
            };
          } else {
            console.error('Login response:', response);
            throw new Error('Invalid credentials');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.access_token = user.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.access_token = token.access_token;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);