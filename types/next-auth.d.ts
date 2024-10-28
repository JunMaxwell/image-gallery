import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    id: string;
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
    };
    accessToken: string;
  }

  interface User {
    id: string;
    email: string;
    password: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: number;
  }
}
