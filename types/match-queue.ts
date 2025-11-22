export type IMatchQueue = {
  userId: string;
  status: "searching" | "matched" | "cancelled" | "matching";
  matchedWith: string;
  roomId: string;
  preferences: {
    interests: string[];
    language: string;
  };
  lockedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  lastHeartbeat: Date;
};

export type MatchQueue = IMatchQueue & { _id: string };

export type CreateQueue = {
  preferences: {
    interests: string[];
    language: string;
  };
};
