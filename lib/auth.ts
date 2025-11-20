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
      preferences?: {
        theme: "light" | "dark";
        hideStatus: boolean;
        hideTypingIndicator: boolean;
      };
      anonAlias?: string | null;
      anonAvatar?: string | null;
      linkedAccounts?: {
        provider: UserOAuthProviders;
        providerAccount: string;
        providerAccountId: string;
      }[];
      sessionId?: string;
      role?: string;
      sessionRevoked?: boolean;
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
    preferences?: {
      theme: "light" | "dark";
      hideStatus: boolean;
      hideTypingIndicator: boolean;
    };
    anonAlias?: string;
    anonAvatar?: string | null;
    linkedAccounts?: {
      provider: UserOAuthProviders;
      providerAccount: string;
      providerAccountId: string;
    }[];
    sessionId?: string;
    role?: string;
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
    preferences?: {
      theme: "light" | "dark";
      hideStatus: boolean;
      hideTypingIndicator: boolean;
    };
    anonAlias?: string;
    anonAvatar?: string | null;
    linkedAccounts?: {
      provider: UserOAuthProviders;
      providerAccount: string;
      providerAccountId: string;
    }[];
    userId?: string;
    role?: string;
    lastRefresh?: number;
    accessToken?: string;
    provider?: string;
    sessionRevoked?: boolean;
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
            role: u.role,
          };
        } catch (err: unknown) {
          const error = err as { response: { data: string } };
          const message = error.response.data || "Invalid credentials";
          throw new Error(message);
        }
      },
    }),
    CredentialsProvider({
      id: "anonymous",
      name: "Anonymous",
      credentials: {
        alias: { label: "Alias", type: "text" },
        avatar: { label: "Avatar", type: "text" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.alias || !credentials?.avatar)
            throw new Error("Please provide alias and avatar.");

          const alias = credentials.alias;
          const avatarUrl = credentials.avatar;
          const { data: anonymous } = await client.post<User>(
            "/auth/anonymous",
            {
              alias: alias,
              avatar: avatarUrl,
            },
          );

          if (!anonymous?._id) throw new Error("Invalid user data returned.");

          return {
            id: anonymous._id.toString(),
            name: anonymous.anonAlias,
            email: anonymous.email,
            image: anonymous.anonAvatar,
            status: anonymous.status,
            isAvailable: anonymous.isAvailable,
            preferences: anonymous.preferences,
            isAnonymous: anonymous.isAnonymous,
            lastActive: anonymous.lastActive,
            createdAt: anonymous.createdAt,
            linkedAccounts: anonymous.linkedAccounts,
            role: anonymous.role,
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
      try {
        const notAllowedProviders = ["credentials", "anonymous"];
        const currentProvider = account?.provider || "credentials";
        const currentProviderAccountId = account?.providerAccountId || "";
        const currentAccountEmail = user.email || "";

        // Get request headers for device info
        const headers = await import("next/headers");
        const headersList = await headers.headers();
        const userAgent = headersList.get("user-agent") || "";
        const ip =
          headersList.get("x-forwarded-for") ||
          headersList.get("x-real-ip") ||
          "unknown";

        const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const deviceInfo = getDeviceInfo(userAgent, ip);

        // ---- Anonymous flow (early return) ----
        if (currentProvider === "anonymous" && user.role === "anonymous") {
          if (!user.name || !user.id) return false;

          const anonymousSession: UserSession = {
            sessionId,
            deviceInfo,
            createdAt: new Date(),
            lastActive: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          };

          await userService.addUserSession(user.id, anonymousSession);
          user.sessionId = sessionId;

          return true;
        }

        if (!user?.email) return false;

        // ---- Authenticated user flow ----
        let existingUser = await userService.getUserByEmail(user.email);

        // Only check linked account if user not found by email
        if (!existingUser && currentProvider !== "credentials") {
          existingUser = await userService.getUserByLinkedAccount(
            currentProvider as UserOAuthProviders,
            currentAccountEmail,
            currentProviderAccountId,
          );
        }

        // Get session once (non-blocking, use Promise)
        const sessionPromise = getServerSession(authOptions).catch(() => null);

        // ---- Linking flow ----
        const session = await sessionPromise;

        if (
          session?.user?.id &&
          session?.user?.sessionId &&
          !notAllowedProviders.includes(currentProvider)
        ) {
          // Parallel fetch current user and session
          const [currentUser, currentSession] = await Promise.all([
            userService.getUserById(session.user.id),
            userService.getCurrentSessionID(
              session.user.id,
              session.user.sessionId,
            ),
          ]);

          if (!currentUser) return false;

          // Check if this linked account belongs to a different user
          if (
            existingUser &&
            existingUser._id.toString() !== currentUser._id.toString()
          ) {
            return "/auth/error?error=AccountExistsWithDifferentCredential";
          }

          // Update linked account
          await userService.updateLinkedAccount(currentUser._id.toString(), {
            provider: currentProvider as UserOAuthProviders,
            providerAccount: currentAccountEmail,
            providerAccountId: currentProviderAccountId,
          });

          // Populate user object
          Object.assign(user, {
            sessionId: currentSession,
            id: currentUser._id.toString(),
            name: currentUser.name,
            email: currentUser.email,
            image: currentUser.avatar,
            status: currentUser.status,
            isAvailable: currentUser.isAvailable,
            lastActive: currentUser.lastActive,
            createdAt: currentUser.createdAt,
            isAnonymous: currentUser.isAnonymous,
            linkedAccounts: currentUser.linkedAccounts,
            preferences: currentUser.preferences,
            role: currentUser.role,
            anonAlias: currentUser.anonAlias,
            anonAvatar: currentUser.anonAvatar,
          });

          return true;
        }

        // ---- Validate OAuth account uniqueness ----
        if (
          account?.provider &&
          user.email &&
          !notAllowedProviders.includes(account.provider)
        ) {
          // Only check if we found a user by email but not by linked account
          if (existingUser) {
            const accountBelongsToUser = existingUser.linkedAccounts?.some(
              (acc) =>
                acc.provider === currentProvider &&
                acc.providerAccountId === currentProviderAccountId,
            );

            if (!accountBelongsToUser) {
              // Check if this linked account belongs to someone else
              const existingLinked = await userService.getUserByLinkedAccount(
                account.provider as UserOAuthProviders,
                user.email,
                account.providerAccountId!,
              );

              if (
                existingLinked &&
                existingLinked._id.toString() !== existingUser._id.toString()
              ) {
                return "/auth/error?error=AccountExistsWithDifferentCredential";
              }
            }
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
              role: "user",
            };

            await client.post("/auth/register", newUserData);
            existingUser = await userService.getUserByEmail(user.email);

            if (!existingUser) {
              console.error("User creation failed for", user.email);
              return false;
            }
          } else {
            return "/auth/error?error=UserNotFound";
          }
        }

        // ---- Update user if needed (batch updates) ----
        const updates: Partial<typeof existingUser> = {};
        const now = new Date();

        // Check if lastActive needs update
        if (existingUser.lastActive.getTime() < now.getTime() - 60000) {
          // Only update if > 1 min old
          updates.lastActive = now;
        }

        // Check if linked account needs to be added
        existingUser.linkedAccounts ??= [];
        const accountExists = existingUser.linkedAccounts.some(
          (acc: UserLinkedAccount) =>
            acc.provider === currentProvider &&
            acc.providerAccount === currentAccountEmail &&
            acc.providerAccountId === currentProviderAccountId,
        );

        if (!accountExists && currentProvider !== "credentials") {
          updates.linkedAccounts = [
            ...existingUser.linkedAccounts,
            {
              provider: currentProvider as UserOAuthProviders,
              providerAccount: currentAccountEmail,
              providerAccountId: currentProviderAccountId,
            },
          ];
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          await userService.updateUser({
            ...existingUser,
            ...updates,
          });
          // Update local reference
          Object.assign(existingUser, updates);
        }

        // ---- Create and add session ----
        const newSession: UserSession = {
          sessionId,
          deviceInfo,
          createdAt: now,
          lastActive: now,
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        await userService.addUserSession(
          existingUser._id.toString(),
          newSession,
        );

        // ---- Populate user object ----
        Object.assign(user, {
          sessionId,
          id: existingUser._id.toString(),
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.avatar,
          status: existingUser.status,
          isAvailable: existingUser.isAvailable,
          lastActive: existingUser.lastActive,
          createdAt: existingUser.createdAt,
          isAnonymous: existingUser.isAnonymous,
          preferences: existingUser.preferences,
          linkedAccounts: existingUser.linkedAccounts,
          role: existingUser.role,
          anonAlias: existingUser.anonAlias,
          anonAvatar: existingUser.anonAvatar,
        });

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
      // ---- Handle invalidated/revoked sessions ----
      if (token.sessionRevoked || token.invalidated) {
        throw new Error("Session revoked.");
      }

      // ---- Handle session updates ----
      if (trigger === "update" && newSession?.user) {
        token.email = newSession.user.email ?? token.email;
        token.name = newSession.user.name ?? token.name;
        token.picture = newSession.user.image ?? token.picture;
        token.status = newSession.user.status ?? token.status;
        token.preferences = newSession.user.preferences ?? token.preferences;
        token.isAvailable = newSession.user.isAvailable ?? token.isAvailable;
        token.linkedAccounts =
          newSession.user.linkedAccounts ?? token.linkedAccounts;
        token.anonAlias = newSession.user.anonAlias ?? token.anonAlias;
        token.anonAvatar = newSession.user.anonAvatar ?? token.anonAvatar;
        token.role = newSession.user.role ?? token.role;
      }

      // ---- Populate session from token ----
      if (session.user) {
        session.user.id = token.userId ?? token.sub!;
        session.user.sessionId = token.sessionId;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.status = token.status!;
        session.user.isAvailable = token.isAvailable!;
        session.user.lastActive = token.lastActive!;
        session.user.createdAt = token.createdAt!;
        session.user.linkedAccounts = token.linkedAccounts!;
        session.user.role = token.role!;
        session.user.isAnonymous = token.isAnonymous!;
        session.user.preferences = token.preferences!;
        session.user.anonAlias = token.anonAlias ?? null;
        session.user.anonAvatar = token.anonAvatar ?? null;
        session.user.role = token.role!;
        session.user.sessionRevoked = token.sessionRevoked;
      }

      return session;
    },

    async jwt({ token, account, user, trigger, session }) {
      // ---- Handle session updates (early return) ----
      if (trigger === "update" && session?.user) {
        return {
          ...token,
          name: session.user.name ?? token.name,
          email: session.user.email ?? token.email,
          picture: session.user.image ?? token.picture,
          status: session.user.status ?? token.status,
          isAvailable: session.user.isAvailable ?? token.isAvailable,
          preferences: session.user.preferences ?? token.preferences,
          linkedAccounts: session.user.linkedAccounts ?? token.linkedAccounts,
          isAnonymous: session.user.isAnonymous ?? token.isAnonymous,
          anonAlias: session.user.anonAlias ?? token.anonAlias,
          anonAvatar: session.user.anonAvatar ?? token.anonAvatar,
          role: session.user.role ?? token.role,
          sessionRevoked: session.user.sessionRevoked ?? token.sessionRevoked,
        };
      }

      // ---- Handle anonymous provider ----
      if (user && token.role === "anonymous") {
        return {
          ...token,
          userId: user.id,
          email: user.email,
          name: user.name,
          isAnonymous: true,
          picture: user.image,
          anonAlias: user.anonAlias,
          status: user.status,
          role: user.role,
          sessionId: user.sessionId,
          preferences: user.preferences,
          lastRefresh: Date.now(),
          sessionRevoked: false,
        };
      }

      // ---- Handle authenticated user (initial sign-in) ----
      if (user && token.role !== "anonymous") {
        token.sessionId = user.sessionId;
        token.userId = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.status = user.status;
        token.isAvailable = user.isAvailable;
        token.preferences = user.preferences;
        token.lastActive = user.lastActive;
        token.createdAt = user.createdAt;
        token.linkedAccounts = user.linkedAccounts?.length
          ? user.linkedAccounts.map((account) => ({
              provider: account.provider,
              providerAccount: account.providerAccount,
              providerAccountId: account.providerAccountId,
            }))
          : [];
        token.role = user.role;
        token.lastRefresh = Date.now();
        token.isAnonymous = user.isAnonymous;
        token.anonAlias = user.anonAlias;
        token.anonAvatar = user.anonAvatar;
        token.sessionRevoked = false;
      }

      // ---- Handle account provider info ----
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      // ---- Refresh token with caching ----
      if (!user && token.email && token.userId && token.sessionId) {
        // Check if session is still valid
        const sessions = await userService.getUserActiveSessions(token.userId);
        const sessionExists = sessions.some(
          (session: UserSession) => session.sessionId === token.sessionId,
        );

        if (!sessionExists) {
          console.warn("Session no longer exists, invalidating token");
          // Mark token as invalid instead of throwing
          return { ...token, sessionRevoked: true, invalidated: true };
        }

        // Only refresh from DB periodically (every 5 minutes)
        const lastRefresh = (token.lastRefresh as number) || 0;
        const now = Date.now();
        const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

        // Skip DB call if recently refreshed
        if (now - lastRefresh < REFRESH_INTERVAL) {
          return token;
        }

        try {
          const dbUser = await userService.getUserByEmail(token.email);

          if (!dbUser) {
            console.warn("User no longer exists, invalidating token");
            // Return token marked for deletion instead of throwing
            return { ...token, sessionRevoked: true, invalidated: true };
          }

          // Update session activity (non-blocking, fire and forget)
          userService
            .updateSessionActivity(
              dbUser._id.toString(),
              token.sessionId as string,
            )
            .catch((err) => console.error("Session update failed:", err));

          // Update token with fresh data
          token.status = dbUser.status;
          token.isAvailable = dbUser.isAvailable;
          token.lastActive = dbUser.lastActive;
          token.createdAt = dbUser.createdAt;
          token.name = dbUser.name;
          token.picture = dbUser.avatar || dbUser.anonAvatar;
          token.isAnonymous = dbUser.isAnonymous;
          token.preferences = {
            theme: dbUser.preferences?.theme || "light",
            hideStatus: dbUser.preferences?.hideStatus || false,
            hideTypingIndicator:
              dbUser.preferences?.hideTypingIndicator || false,
          };
          token.linkedAccounts = dbUser.linkedAccounts?.length
            ? dbUser.linkedAccounts.map((account) => ({
                provider: account.provider,
                providerAccount: account.providerAccount,
                providerAccountId: account.providerAccountId,
              }))
            : [];
          token.role = dbUser.role;
          token.lastRefresh = now;
        } catch (err) {
          console.error("JWT refresh failed:", err);
          // Mark token as invalid instead of throwing
          return { ...token, sessionRevoked: true, invalidated: true };
        }
      }

      // ---- Validate session exists ----
      if (!token.sessionId && !user) {
        console.warn("Missing sessionId, invalidating token");
        return { ...token, sessionRevoked: true, invalidated: true };
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
