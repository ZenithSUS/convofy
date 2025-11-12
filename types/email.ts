export type EmailTokenData = {
  currentEmail: string;
  newEmail: string;
  createdAt: string;
  requiresPassword: boolean;
  expiresIn: number;
};

export type EmailChangeData = {
  newEmail: string;
  currentEmail: string;
  password: string;
  token: string;
  userId: string;
};

export type EmailRecoveryData = {
  recoveryEmail: string;
  expiresIn: string;
};
