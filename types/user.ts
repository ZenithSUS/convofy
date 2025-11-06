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
  isAnonymous?: boolean;
  // anonAlias?: string | null;
  // anonAvatar?: string | null;
  linkedAccounts: {
    provider: UserOAuthProviders;
    providerAccount: string;
    providerAccountId: string;
  }[];
  activeSessions: UserSession[];
  sessionId?: string;
};

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
