// Next
import { getServerSession, NextAuthOptions } from "next-auth";

// Lib
import client from "@/lib/axios";

// Utils
import { getDeviceInfo } from "./utils";

// Types
import {
  User,
  UserCreate,
  UserLinkedAccount,
  UserOAuthProviders,
} from "@/types/user";

// Models
import { UserSession } from "@/models/User";

// Services
import userService from "@/services/mongodb/user.service";

// Providers
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      status?: string | null;
      isAvailable?: boolean;
      lastActive?: Date | null;
      createdAt?: Date | null;
      isAnonymous?: boolean;
      anonAlias?: string;
      anonAvatar?: string | null;
      linkedAccounts?: {
        provider: UserOAuthProviders;
        providerAccount: string;
        providerAccountId: string;
      }[];
      sessionId?: string;
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
    isAvailable?: boolean;
    isAnonymous?: boolean;
    anonAlias?: string;
    anonAvatar?: string | null;
    linkedAccounts?: {
      provider: UserOAuthProviders;
      providerAccount: string;
      providerAccountId: string;
    }[];
    sessionId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionId?: string;
    status?: string | null;
    lastActive?: Date | null;
    createdAt?: Date | null;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    isAvailable?: boolean;
    isAnonymous?: boolean;
    anonAlias?: string;
    anonAvatar?: string | null;
    linkedAccounts?: {
      provider: UserOAuthProviders;
      providerAccount: string;
      providerAccountId: string;
    }[];
    userId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password.");
        }

        try {
          const { data: u } = await client.post<User>(
            "/auth/login",
            credentials,
          );

          if (!u?._id) throw new Error("Invalid user data returned.");

          return {
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            image: u.avatar,
            status: u.status,
            isAvailable: u.isAvailable,
            lastActive: u.lastActive,
            createdAt: u.createdAt,
            linkedAccounts: u.linkedAccounts,
          };
        } catch (err: unknown) {
          const error = err as { response: { data: string } };
          const message = error.response.data || "Invalid credentials";
          throw new Error(message);
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId:
        process.env.NODE_ENV === "production"
          ? process.env.GITHUB_CLIENT_ID_PROD!
          : process.env.GITHUB_CLIENT_ID_DEV!,
      clientSecret:
        process.env.NODE_ENV === "production"
          ? process.env.GITHUB_CLIENT_SECRET_PROD!
          : process.env.GITHUB_CLIENT_SECRET_DEV!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;

      try {
        const currentProvider = account?.provider || "credentials";
        const currentProviderAccountId = account?.providerAccountId || "";
        const currentAccountEmail = user.email || "";

        // ---- Login flow ----
        let existingUser = await userService.getUserByLinkedAccount(
          currentProvider as UserOAuthProviders,
          currentAccountEmail,
          currentProviderAccountId,
        );

        // If the user linked account is not found, try to get the user by email
        if (!existingUser) {
          existingUser = await userService.getUserByEmail(user.email);
        }

        // Try to get the current session (may be null)
        const session = await getServerSession(authOptions).catch(() => null);

        // ---- Linking flow ----
        if (
          session?.user?.id &&
          session?.user?.sessionId &&
          currentProvider !== "credentials"
        ) {
          // Get the current user and current session
          const currentUser = await userService.getUserById(session.user.id);
          const currentSession = await userService.getCurrentSessionID(
            session.user.id,
            session.user.sessionId,
          );

          if (!currentUser) return false;

          const linkedAccount = await userService.getUserByLinkedAccount(
            currentProvider as UserOAuthProviders,
            currentAccountEmail,
            currentProviderAccountId,
          );

          if (
            linkedAccount &&
            linkedAccount._id.toString() !== currentUser._id.toString()
          ) {
            return "/auth/error?error=AccountExistsWithDifferentCredential";
          }

          await userService.updateLinkedAccount(currentUser._id.toString(), {
            provider: currentProvider as UserOAuthProviders,
            providerAccount: currentAccountEmail,
            providerAccountId: currentProviderAccountId,
          });

          // Make the current user the logged in user
          user.sessionId = currentSession;
          user.id = currentUser._id.toString();
          user.name = currentUser.name;
          user.email = currentUser.email;
          user.image = currentUser.avatar;
          user.status = currentUser.status;
          user.isAvailable = currentUser.isAvailable;
          user.lastActive = currentUser.lastActive;
          user.createdAt = currentUser.createdAt;
          user.linkedAccounts = currentUser.linkedAccounts;

          return true;
        }

        // ---- Normal OAuth / Credentials SignIn ----
        if (
          account?.provider &&
          user.email &&
          account.provider !== "credentials"
        ) {
          const existingLinked = await userService.getUserByLinkedAccount(
            account.provider as UserOAuthProviders,
            user.email,
            account.providerAccountId!,
          );

          if (
            existingLinked &&
            (!existingUser ||
              existingLinked._id.toString() !== existingUser._id.toString())
          ) {
            return "/auth/error?error=AccountExistsWithDifferentCredential";
          }
        }

        // ---- Create user if doesn't exist ----
        if (!existingUser) {
          if (account?.provider !== "credentials") {
            const newUserData: UserCreate = {
              name: user.name ?? "Unnamed User",
              email: user.email,
              avatar: user.image || "",
              status: "online",
              lastActive: new Date(),
              createdAt: new Date(),
              isAnonymous: false,
              linkedAccounts: [
                {
                  provider: currentProvider as UserOAuthProviders,
                  providerAccount: currentAccountEmail,
                  providerAccountId: currentProviderAccountId,
                },
              ],
            };

            await client.post("/auth/register", newUserData);
            existingUser = await userService.getUserByEmail(user.email);
          } else {
            return "auth/error?error=UserNotFound";
          }
        }

        if (!existingUser) {
          console.error("User creation failed for", user.email);
          return false;
        }

        // Ensure arrays exist
        existingUser.linkedAccounts ??= [];

        let needsUpdate = false;

        // Update lastActive
        if (existingUser.lastActive.getTime() < Date.now()) {
          existingUser.lastActive = new Date();
          needsUpdate = true;
        }

        const accountExists = existingUser.linkedAccounts.some(
          (acc: UserLinkedAccount) =>
            acc.provider === currentProvider &&
            acc.providerAccount === currentAccountEmail &&
            acc.providerAccountId === currentProviderAccountId,
        );

        if (!accountExists) {
          existingUser.linkedAccounts.push({
            provider: currentProvider as UserOAuthProviders,
            providerAccount: currentAccountEmail,
            providerAccountId: currentProviderAccountId,
          });
          needsUpdate = true;
        }

        if (needsUpdate) {
          await userService.updateUser(existingUser);
        }

        // Get request headers for device info
        const headers = await import("next/headers");
        const headersList = await headers.headers();
        const userAgent = headersList.get("user-agent") || "";
        const ip =
          headersList.get("x-forwarded-for") ||
          headersList.get("x-real-ip") ||
          "unknown";

        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const deviceInfo = getDeviceInfo(userAgent, ip);

        const newSession: UserSession = {
          sessionId,
          deviceInfo,
          createdAt: new Date(),
          lastActive: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        // Add session to user's active sessions
        await userService.addUserSession(
          existingUser._id.toString(),
          newSession,
        );

        // Set user properties
        user.sessionId = sessionId;
        user.id = existingUser._id.toString();
        user.name = existingUser.name;
        user.email = existingUser.email;
        user.image = existingUser.avatar;
        user.status = existingUser.status;
        user.isAvailable = existingUser.isAvailable;
        user.lastActive = existingUser.lastActive;
        user.createdAt = existingUser.createdAt;
        user.linkedAccounts = existingUser.linkedAccounts;

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/chat`;
    },

    async session({ session, token, trigger, newSession }) {
      if (trigger === "update" && newSession) {
        token.name = newSession.user?.name ?? token.name;
        token.picture = newSession.user?.image ?? token.picture;
        token.status = newSession.user?.status ?? token.status;
        token.isAvailable = newSession.user?.isAvailable ?? token.isAvailable;
        token.linkedAccounts =
          newSession.user?.linkedAccounts ?? token.linkedAccounts;
      }

      if (session.user) {
        session.user.id = token.userId ?? token.sub!;
        session.user.sessionId = token.sessionId;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.status = token.status!;
        session.user.isAvailable = token.isAvailable!;
        session.user.lastActive = token.lastActive!;
        session.user.createdAt = token.createdAt!;
        session.user.linkedAccounts = token.linkedAccounts!;
      }

      try {
        const existingUser = await userService.getUserByEmail(
          session.user.email!,
        );
        if (!existingUser) return session;

        // Validate session
        if (token.sessionId) {
          const sessionExists =
            existingUser.activeSessions?.some(
              (s) => s.sessionId === token.sessionId,
            ) ?? false;

          if (!sessionExists) {
            throw new Error("Session revoked");
          }
        }
      } catch (err) {
        console.warn("Session validation failed:", err);
        throw new Error("Session validation failed");
      }

      return session;
    },

    async jwt({ token, account, user, trigger, session }) {
      if (trigger === "update" && session) {
        token.name = session.user?.name ?? token.name;
        token.picture = session.user?.image ?? token.picture;
        token.status = session.user?.status ?? token.status;
        token.isAvailable = session.user?.isAvailable ?? token.isAvailable;
        token.linkedAccounts =
          session.user?.linkedAccounts ?? token.linkedAccounts;
        return token;
      }

      if (user) {
        token.sessionId = user.sessionId;
        token.userId = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.status = user.status;
        token.isAvailable = user.isAvailable;
        token.lastActive = user.lastActive;
        token.createdAt = user.createdAt;
        token.linkedAccounts =
          user.linkedAccounts?.map((account) => ({
            provider: account.provider,
            providerAccount: account.providerAccount,
            providerAccountId: account.providerAccountId,
          })) ?? [];
      }

      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      // ---- Refresh token ----

      if (!user && token.email && token.sessionId) {
        try {
          const dbUser = await userService.getUserByEmail(token.email);
          if (dbUser) {
            const sessionExists =
              dbUser.activeSessions?.some(
                (session) => session.sessionId === token.sessionId,
              ) ?? false;

            if (!sessionExists) {
              throw new Error("Session revoked");
            }

            await userService.updateSessionActivity(
              dbUser._id.toString(),
              token.sessionId as string,
            );

            token.status = dbUser.status;
            token.isAvailable = dbUser.isAvailable;
            token.lastActive = dbUser.lastActive;
            token.createdAt = dbUser.createdAt;
            token.name = dbUser.name;
            token.picture = dbUser.avatar;
            token.linkedAccounts =
              dbUser.linkedAccounts?.map((account) => ({
                provider: account.provider,
                providerAccount: account.providerAccount,
                providerAccountId: account.providerAccountId,
              })) ?? [];
          }
        } catch (err) {
          console.warn("JWT refresh failed:", err);
          throw err;
        }
      }

      // ---- Invalid session ----
      if (!token.sessionId) {
        throw new Error("Invalid session");
      }

      return token;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    signOut: "/auth/login",
  },
};
