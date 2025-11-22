export type IMatchQueue = {
  userId: string;
  status: "searching" | "matched" | "cancelled";
  matchedWith: string;
  roomId: string;
  preferences: {
    interests: string[];
    language: string;
  };
  expiresAt: Date;
};

export type MatchQueue = IMatchQueue & { _id: string };

export type CreateQueue = {
  preferences: {
    interests: string[];
    language: string;
  };
};
