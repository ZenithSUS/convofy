import { Room } from "@/types/room";

export const Rooms: Room[] = [
  {
    _id: "6700211a1c6d8f5a11111111",
    name: "Frontend Devs",
    description: "Room for frontend developers",
    members: [
      { userId: "66ffabcd1234ef5678900001", username: "jeran", role: "admin" },
      { userId: "66ffabcd1234ef5678900002", username: "alex", role: "member" },
      { userId: "66ffabcd1234ef5678900003", username: "mia", role: "member" },
    ],
    createdAt: "2025-09-29T10:15:00.000Z",
    updatedAt: "2025-09-29T10:15:00.000Z",
  },
  {
    _id: "6700211a1c6d8f5a22222222",
    name: "Project Alpha",
    description: "Private project discussion room",
    members: [
      { userId: "66ffabcd1234ef5678900001", username: "jeran", role: "admin" },
      { userId: "66ffabcd1234ef5678900004", username: "sam", role: "member" },
    ],
    createdAt: "2025-09-29T10:20:00.000Z",
    updatedAt: "2025-09-29T10:20:00.000Z",
  },
];
