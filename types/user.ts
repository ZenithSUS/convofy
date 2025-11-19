import { UserSession } from "@/models/User";

export type UserOAuthProviders =
  | "credentials"
  | "google"
  | "github"
  | "discord";

export type User = {
  _id: string;
  name: string;
  password?: string;
  email: string;
  avatar: string;
  status: "online" | "offline";
  lastActive: Date;
  createdAt: Date;
  isAvailable: boolean;
  isAnonymous?: boolean;
  preferences: {
    theme: "light" | "dark";
    hideStatus: boolean;
    hideTypingIndicator: boolean;
  };
  anonAlias?: string | null;
  anonAvatar?: string | null;
  linkedAccounts: {
    provider: UserOAuthProviders;
    providerAccount: string;
    providerAccountId: string;
  }[];
  activeSessions: UserSession[];
  sessionId?: string;
  role: "user" | "anonymous" | "admin";
};

export type UserCreate = Omit<
  User,
  "_id" | "activeSessions" | "isAvailable" | "isDarkMode" | "preferences"
>;

export type UserLinkedAccount = {
  provider: UserOAuthProviders;
  providerAccount: string;
  providerAccountId: string;
};

export type UserMediaDataStats = {
  messages: number;
  medias: number;
  contacts: number;
};

export type UserMessageDataStats = {
  messages: number;
  nonTextMessages: number;
  editedMessages: number;
};

export type CreateLinkedAccount = {
  id: string;
  credentials: {
    email: string;
    password: string;
  };
  linkedAccount: UserLinkedAccount;
};

export type UserChangePassword = {
  id: string;
  oldPassword: string;
  newPassword: string;
};

export type UserTyping = Omit<User, "_id" | "activeSessions"> & {
  id: string;
};

export type UserUpdatePreferences = Pick<User, "preferences"> & {
  userId: string;
  isAnonymous: boolean;
};
