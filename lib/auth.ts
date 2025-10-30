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
      providers?: string[] | null;
      isAnonymous?: boolean;
      anonAlias?: string;
      anonAvatar?: string | null;
    };
  }
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    status?: string | null;
    providers?: string[] | null;
    lastActive?: Date | null;
    createdAt?: Date | null;
    isAnonymous?: boolean;
    anonAlias?: string;
    anonAvatar?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    status?: string | null;
    lastActive?: Date | null;
    createdAt?: Date | null;
    name?: string | null;
    picture?: string | null;
    providers?: string[] | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials", // Add explicit id
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
            providers: u.providers,
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
    async signIn({ user, account }) {
      if (!user?.email) return false;

      try {
        let existingUser = await userService.getUserByEmail(user.email);

        // If user not found, create one and re-fetch it
        if (!existingUser) {
          const userData: Omit<User, "_id"> = {
            name: user.name ?? "Unnamed User",
            email: user.email,
            avatar: user.image || "",
            status: "online",
            lastActive: new Date(),
            createdAt: new Date(),
            providers: account?.provider ? [account.provider] : ["credentials"],
          };

          await client.post("/auth/register", userData);
          existingUser = await userService.getUserByEmail(user.email);
        }

        if (!existingUser) {
          console.error("User creation failed for", user.email);
          return false;
        }

        // This fixes the issue with existing users
        if (!existingUser.providers) {
          existingUser.providers = [];
        }

        // If providers array is empty, add the current login method
        if (existingUser.providers.length === 0) {
          const currentProvider = account?.provider || "credentials";
          existingUser.providers = [currentProvider];
          await userService.updateUser(existingUser);
        }
        // If user has providers but current one isn't in the list, add it
        else if (
          account?.provider &&
          !existingUser.providers.includes(account.provider)
        ) {
          existingUser.providers.push(account.provider);
          await userService.updateUser(existingUser);
        }

        // Attach existing data to user
        user.id = existingUser._id.toString();
        user.name = existingUser.name;
        user.email = existingUser.email;
        user.image = existingUser.avatar;
        user.status = existingUser.status;
        user.lastActive = existingUser.lastActive;
        user.createdAt = existingUser.createdAt;
        user.providers = existingUser.providers;

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
    async session({ session, token, trigger, newSession }) {
      // Handle manual session updates (when update() is called)
      if (trigger === "update" && newSession) {
        // Update token data with new session data
        if (newSession.user?.name) {
          token.name = newSession.user.name;
        }
        if (newSession.user?.image) {
          token.picture = newSession.user.image;
        }
      }

      // Add additional data to session from token
      if (session.user) {
        session.user.id = token.sub!;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.status = token.status!;
        session.user.lastActive = token.lastActive!;
        session.user.createdAt = token.createdAt!;
        session.user.providers = token.providers!;
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
    // Accept trigger parameter and handle updates
    async jwt({ token, account, user, trigger, session }) {
      // Handle manual token updates (when update() is called)
      if (trigger === "update" && session) {
        // Update token with new data from session
        if (session.user?.name) {
          token.name = session.user.name;
        }
        if (session.user?.image) {
          token.picture = session.user.image;
        }
        if (session.user?.status) {
          token.status = session.user.status;
        }

        return token;
      }

      // Check first if the user still exists in the database
      const existingUser = await userService.getUserByEmail(token.email!);
      if (!existingUser) {
        // If user no longer exists, invalidate the token
        throw new Error("User no longer exists");
      }

      // Persist additional data to token
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      // On initial sign in, set all user data from user object
      if (user) {
        token.name = user.name;
        token.picture = user.image;
        token.status = user.status;
        token.lastActive = user.lastActive;
        token.createdAt = user.createdAt;
        token.providers = user.providers;
      }

      // Fetch user data to set additional fields (if not initial sign in)
      if (!user && token.email) {
        const dbUser = await userService.getUserByEmail(token.email);
        if (dbUser) {
          token.status = dbUser.status;
          token.lastActive = dbUser.lastActive;
          token.createdAt = dbUser.createdAt;
          token.name = dbUser.name;
          token.picture = dbUser.avatar;
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
