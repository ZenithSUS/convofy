import client from "@/lib/axios";
import userService from "@/services/mongodb/user.service";
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
      if (!user?.email) return false;

      try {
        let existingUser = await userService.getUserByEmail(user.email);

        // If user not found, create one and re-fetch it
        if (!existingUser) {
          const userData: Omit<User, "_id"> = {
            name: user.name ?? "Unnamed User",
            email: user.email,
            avatar: user.image!,
            status: "online",
            lastActive: new Date(),
            createdAt: new Date(),
          };

          await client.post("/auth/register", userData);
          existingUser = await userService.getUserByEmail(user.email);
        }

        if (!existingUser) {
          console.error("User creation failed for", user.email);
          return false;
        }

        // Attach additional fields to session user
        user.id = existingUser._id?.toString();
        user.status = existingUser.status;
        user.lastActive = existingUser.lastActive;
        user.createdAt = existingUser.createdAt;

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },
    // args (url, baseUrl)
    async redirect({ baseUrl }) {
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

      // Check first if the user still exists in the database
      const existingUser = await userService.getUserByEmail(
        session.user.email!,
      );
      if (!existingUser) {
        // If user no longer exists, invalidate the session
        throw new Error("User no longer exists");
      }

      return session;
    },
    // args (token, account, profile)
    async jwt({ token, account }) {
      // Check first if the user still exists in the database
      const existingUser = await userService.getUserByEmail(token.email!);
      if (!existingUser) {
        // If user no longer exists, invalidate the token
        throw new Error("User no longer exists");
      }

      // Persist additional data to token
      if (account) {
        token.accessToken = account.access_token;
      }
      // Fetch user data to set additional fields
      if (token.email) {
        const user = await userService.getUserByEmail(token.email);
        if (user) {
          token.status = user.status;
          token.lastActive = user.lastActive;
          token.createdAt = user.createdAt;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/auth/login",
  },
};
