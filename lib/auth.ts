import client from "@/services/axios";
import { getUserByEmail } from "@/services/user.service";
import { User } from "@/types/user";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      status?: string | null;
      lastActive?: Date | null;
      createdAt?: Date | null;
    };
  }
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    status?: string | null;
    lastActive?: Date | null;
    createdAt?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    status?: string | null;
    lastActive?: Date | null;
    createdAt?: Date | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password.");
        }

        try {
          const response: { data: User } = await client.post(
            "/auth/login",
            credentials,
          );
          const u = response.data;

          return {
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            image: u.avatar,
            status: u.status,
            lastActive: u.lastActive,
            createdAt: u.createdAt,
          };
        } catch (err: unknown) {
          const error = err as { response: { data: string } };
          throw new Error(error.response?.data || "Invalid credentials");
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // args: (user, account, profile)
    async signIn({ user }) {
      // Add user id to session
      if (user && user.email) {
        const response = await getUserByEmail(user.email);

        // If user is not found, create it
        if (!response) {
          const userData: Omit<User, "_id"> = {
            name: user.name!,
            email: user.email!,
            avatar: user.image!,
            status: "online",
            lastActive: new Date(),
            createdAt: new Date(),
          };

          await client.post("/auth/register", userData);
        }

        // Check if there is a response data
        if (!response) return false;

        // Set user data
        user.id = response._id;
        user.status = response.status;
        user.lastActive = response.lastActive;
        user.createdAt = response.createdAt;
      }
      return true;
    },

    async redirect({ url, baseUrl }) {
      if (!url) {
        return baseUrl;
      }
      // Redirect to /chat after successful sign in
      return baseUrl + "/chat";
    },
    async session({ session, token }) {
      // Add additional data to session
      if (session.user) {
        session.user.id = token.sub!;
        session.user.status = token.status!;
        session.user.lastActive = token.lastActive!;
        session.user.createdAt = token.createdAt!;
      }
      return session;
    },
    // args (token, account, profile)
    async jwt({ token, account }) {
      // Persist additional data to token
      if (account) {
        token.accessToken = account.access_token;
      }
      // Fetch user data to set additional fields
      if (token.email) {
        const user = await getUserByEmail(token.email);
        if (user) {
          token.status = user.status;
          token.lastActive = user.lastActive;
          token.createdAt = user.createdAt;
        }
      }

      return token;
    },
  },
};
