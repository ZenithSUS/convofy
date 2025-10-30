import client from "@/lib/axios";
import userService from "@/services/mongodb/user.service";
import { User, UserOAuthProviders } from "@/types/user";
import { getServerSession, NextAuthOptions } from "next-auth";
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
      linkedAccounts?: {
        provider: UserOAuthProviders;
        providerAccountId: string;
      }[];
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
    linkedAccounts?: {
      provider: UserOAuthProviders;
      providerAccountId: string;
    }[];
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
    isAnonymous?: boolean;
    anonAlias?: string;
    anonAvatar?: string | null;
    linkedAccounts?: {
      provider: UserOAuthProviders;
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
            lastActive: u.lastActive,
            createdAt: u.createdAt,
            providers: u.providers,
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

        let existingUser = await userService.getUserByEmail(user.email);

        // Try to get the current session (may be null)
        const session = await getServerSession(authOptions).catch(() => null);

        // ---- Linking flow ----
        if (session?.user?.id && currentProvider !== "credentials") {
          const currentUser = await userService.getUserById(session.user.id);
          if (!currentUser) return false;

          const linkedAccount = await userService.getUserByLinkedAccount(
            currentProvider as UserOAuthProviders,
            currentProviderAccountId,
          );

          if (
            linkedAccount &&
            linkedAccount._id.toString() !== currentUser._id.toString()
          ) {
            throw new Error(
              "This OAuth account is already linked to another user.",
            );
          }

          const alreadyLinked = currentUser.linkedAccounts.some(
            (acc: {
              provider: UserOAuthProviders;
              providerAccountId: string;
            }) =>
              acc.provider === currentProvider &&
              acc.providerAccountId === currentProviderAccountId,
          );

          if (!alreadyLinked) {
            currentUser.linkedAccounts.push({
              provider: currentProvider as UserOAuthProviders,
              providerAccountId: currentProviderAccountId,
            });
            if (!currentUser.providers.includes(currentProvider)) {
              currentUser.providers.push(currentProvider);
            }
            await userService.updateUser(currentUser);
          }

          user.id = currentUser._id.toString();
          return true;
        }

        // ---- Normal OAuth / Credentials SignIn ----
        if (account?.provider && account.provider !== "credentials") {
          const existingLinked = await userService.getUserByLinkedAccount(
            account.provider as UserOAuthProviders,
            account.providerAccountId!,
          );

          if (
            existingLinked &&
            (!existingUser ||
              existingLinked._id.toString() !== existingUser._id.toString())
          ) {
            throw new Error("This account is already linked to another user.");
          }
        }

        // ---- Create user if doesn't exist ----
        if (!existingUser) {
          const newUserData: Omit<User, "_id"> = {
            name: user.name ?? "Unnamed User",
            email: user.email,
            avatar: user.image || "",
            status: "online",
            lastActive: new Date(),
            createdAt: new Date(),
            providers: [currentProvider],
            isAnonymous: false,
            linkedAccounts: [
              {
                provider: currentProvider as UserOAuthProviders,
                providerAccountId: currentProviderAccountId,
              },
            ],
          };

          await client.post("/auth/register", newUserData);
          existingUser = await userService.getUserByEmail(user.email);
        }

        if (!existingUser) {
          console.error("User creation failed for", user.email);
          return false;
        }

        // Ensure arrays exist
        existingUser.providers ??= [];
        existingUser.linkedAccounts ??= [];

        let needsUpdate = false;

        if (!existingUser.providers.includes(currentProvider)) {
          existingUser.providers.push(currentProvider);
          needsUpdate = true;
        }

        const accountExists = existingUser.linkedAccounts.some(
          (acc) =>
            acc.provider === currentProvider &&
            acc.providerAccountId === currentProviderAccountId,
        );

        if (!accountExists) {
          existingUser.linkedAccounts.push({
            provider: currentProvider as UserOAuthProviders,
            providerAccountId: currentProviderAccountId,
          });
          needsUpdate = true;
        }

        if (needsUpdate) {
          await userService.updateUser(existingUser);
        }

        user.id = existingUser._id.toString();
        user.name = existingUser.name;
        user.email = existingUser.email;
        user.image = existingUser.avatar;
        user.status = existingUser.status;
        user.lastActive = existingUser.lastActive;
        user.createdAt = existingUser.createdAt;
        user.providers = existingUser.providers;
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
      }

      if (session.user) {
        session.user.id = token.userId ?? token.sub!;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.status = token.status!;
        session.user.lastActive = token.lastActive!;
        session.user.createdAt = token.createdAt!;
        session.user.providers = token.providers!;
        session.user.linkedAccounts = token.linkedAccounts!;
      }

      try {
        const existingUser = await userService.getUserByEmail(
          session.user.email!,
        );
        if (!existingUser) return session;
      } catch (err) {
        console.warn("Session validation failed:", err);
        return session;
      }

      return session;
    },

    async jwt({ token, account, user, trigger, session }) {
      if (trigger === "update" && session) {
        token.name = session.user?.name ?? token.name;
        token.picture = session.user?.image ?? token.picture;
        token.status = session.user?.status ?? token.status;
        return token;
      }

      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.status = user.status;
        token.lastActive = user.lastActive;
        token.createdAt = user.createdAt;
        token.providers = user.providers;
        token.linkedAccounts = user.linkedAccounts;
      }

      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      if (!user && token.email) {
        try {
          const dbUser = await userService.getUserByEmail(token.email);
          if (dbUser) {
            token.status = dbUser.status;
            token.lastActive = dbUser.lastActive;
            token.createdAt = dbUser.createdAt;
            token.name = dbUser.name;
            token.picture = dbUser.avatar;
          }
        } catch (err) {
          console.warn("JWT refresh failed:", err);
        }
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
