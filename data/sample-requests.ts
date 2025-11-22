import { RoomRequest } from "@/types/room";

export const sampleMessageRequests: RoomRequest[] = [
  {
    _id: "req_001",
    name: "Chat with Sarah",
    image: "https://i.pravatar.cc/150?img=1",
    isPrivate: true,
    isAnonymous: false,
    invitedBy: {
      _id: "user_101",
      name: "Sarah Johnson",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    invitedUser: "user_current",
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    lastMessage: {
      _id: "msg_001",
      room: "req_001",
      sender: "user_101",
      content:
        "Hey! I saw your profile and would love to connect. Are you interested in discussing the new project?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      status: {
        deliveredTo: [],
        seenBy: [],
      },
      isEdited: false,
    },
  },
  {
    _id: "req_002",
    name: "Chat with Michael",
    image: "https://i.pravatar.cc/150?img=12",
    isPrivate: true,
    isAnonymous: false,
    invitedBy: {
      _id: "user_102",
      name: "Michael Chen",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    invitedUser: "user_current",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    lastMessage: {
      _id: "msg_002",
      room: "req_002",
      sender: "user_102",
      content: "Hi there! Want to collaborate on the upcoming event?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: {
        deliveredTo: [],
        seenBy: [],
      },
      isEdited: false,
    },
  },
  {
    _id: "req_003",
    name: "Chat with Emily",
    image: "https://i.pravatar.cc/150?img=5",
    isPrivate: true,
    isAnonymous: false,
    invitedBy: {
      _id: "user_103",
      name: "Emily Rodriguez",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    invitedUser: "user_current",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    lastMessage: {
      _id: "msg_003",
      room: "req_003",
      sender: "user_103",
      content:
        "Hello! I noticed we have mutual friends. Would be great to chat! 👋",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: {
        deliveredTo: [],
        seenBy: [],
      },
      isEdited: false,
    },
  },
  {
    _id: "req_004",
    name: "Chat with David",
    image: "https://i.pravatar.cc/150?img=15",
    isPrivate: true,
    isAnonymous: false,
    invitedBy: {
      _id: "user_104",
      name: "David Park",
      avatar: "https://i.pravatar.cc/150?img=15",
    },
    invitedUser: "user_current",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    lastMessage: {
      _id: "msg_004",
      room: "req_004",
      sender: "user_104",
      content: "Quick question about the documentation you shared last week",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      status: {
        deliveredTo: [],
        seenBy: [],
      },
      isEdited: false,
    },
  },
  {
    _id: "req_005",
    name: "Chat with Jessica",
    image: "https://i.pravatar.cc/150?img=9",
    isPrivate: true,
    isAnonymous: false,
    invitedBy: {
      _id: "user_105",
      name: "Jessica Williams",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    invitedUser: "user_current",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    lastMessage: {
      _id: "msg_005",
      room: "req_005",
      sender: "user_105",
      content: "Thanks for the recommendation! Can we discuss it further?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      status: {
        deliveredTo: [],
        seenBy: [],
      },
      isEdited: false,
    },
  },
  {
    _id: "req_006",
    name: "Chat with Alex",
    image: "https://i.pravatar.cc/150?img=33",
    isPrivate: true,
    isAnonymous: false,
    invitedBy: {
      _id: "user_106",
      name: "Alex Thompson",
      avatar: "https://i.pravatar.cc/150?img=33",
    },
    invitedUser: "user_current",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    lastMessage: {
      _id: "msg_006",
      room: "req_006",
      sender: "user_106",
      content: "I have some ideas for the presentation. Let's connect!",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      status: {
        deliveredTo: [],
        seenBy: [],
      },
      isEdited: false,
    },
  },
];

// Empty state sample
export const emptyMessageRequests: RoomRequest[] = [];
