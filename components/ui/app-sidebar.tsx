"use client";

import {
  Home,
  MessageCircleCode,
  Navigation2,
  Search,
  Settings,
  User,
  MessageSquare,
  Clock,
  FileImageIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGetRoomByUserId } from "@/hooks/use-rooms";
import { useMemo } from "react";
import { RoomContent } from "@/types/room";
import Image from "next/image";
import useHybridSession from "@/hooks/use-hybrid-session";
import { Session } from "@/app/(views)/chat/components/chat-header";

// Menu items
const items = [
  {
    title: "Chats",
    url: "/chat",
    icon: MessageCircleCode,
  },

  {
    title: "Create Room",
    url: "/chat/create",
    icon: Home,
  },
  {
    title: "Message Requests",
    url: "/chat/requests",
    icon: MessageSquare,
  },
  {
    title: "Profile",
    url: "/chat/profile",
    icon: User,
  },
  {
    title: "Search Message",
    url: "/chat/profile/messages",
    icon: Search,
  },

  {
    title: "Media",
    url: "/chat/profile/media",
    icon: FileImageIcon,
  },
  {
    title: "Settings",
    url: "/chat/profile/account",
    icon: Settings,
  },
];

export function AppSidebar({ serverSession }: { serverSession: Session }) {
  const pathname = usePathname();
  const { session } = useHybridSession(serverSession);

  const userId = session?.user?.id;
  const isAvailable = session?.user?.isAvailable;

  // Fetch rooms only when in a chat room
  const { data: rooms, isLoading } = useGetRoomByUserId(
    userId,
    isAvailable || false,
    false,
    "",
  );

  const roomsList = useMemo<RoomContent[]>(() => {
    if (!rooms) return [];

    return rooms.sort((a, b) => {
      const aLastMessage = new Date(a.lastMessage?.createdAt || 0);
      const bLastMessage = new Date(b.lastMessage?.createdAt || 0);

      return bLastMessage.getTime() - aLastMessage.getTime();
    });
  }, [rooms]);

  const privateRoomChatName = (room: RoomContent) => {
    const otherUser = room.members.find((m) => m._id !== userId);
    return otherUser?.name || "Unknown User";
  };

  const privateRoomChatImage = (room: RoomContent) => {
    const otherUser = room.members.find((m) => m._id !== userId);
    return otherUser?.avatar || "/default-avatar.png";
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Sidebar className="overflow border-r border-gray-200">
      <SidebarContent className="overflow-hidden bg-linear-to-b from-gray-50 to-white">
        {/* Navigation Section */}
        <SidebarGroup className="space-y-4 p-4">
          <SidebarGroupLabel className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-purple-600 shadow-md">
              <Navigation2 className="h-4 w-4 text-white" />
            </div>
            <h1 className="truncate bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-lg font-bold text-transparent">
              Navigation
            </h1>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`transition-all duration-200 ${
                        isActive
                          ? "bg-linear-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 rounded-lg px-3 py-2"
                      >
                        <item.icon
                          className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-600"}`}
                        />
                        <span
                          className={`font-medium ${isActive ? "text-white" : "text-gray-700"}`}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats Section */}

        <SidebarSeparator className="my-2" />

        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                Recent Chats
              </span>
            </div>
            {roomsList.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                {roomsList.length}
              </span>
            )}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-5">
              {isLoading ? (
                <div className="px-3 py-8 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-2 text-xs text-gray-500">Loading chats...</p>
                </div>
              ) : roomsList.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <MessageCircleCode className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-xs text-gray-500">No chats yet</p>
                </div>
              ) : (
                roomsList.slice(0, 10).map((room) => {
                  const isCurrentRoom = pathname?.includes(room._id);
                  const isGroupChat = !room.isPrivate;

                  return (
                    <SidebarMenuItem key={room._id}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 ${
                          isCurrentRoom
                            ? "border border-blue-200 bg-blue-50"
                            : "hover:bg-gray-50"
                        } px-3 py-5`}
                      >
                        <Link
                          href={`/chat/${room._id}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2"
                          title={room.name}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {isGroupChat ? (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-400 to-pink-400">
                                <Image
                                  src={room.image || "/default-avatar.png"}
                                  alt={room.name || "Avatar"}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                                />
                              </div>
                            ) : (
                              <Image
                                src={privateRoomChatImage(room)}
                                alt={room.name || "Avatar"}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                              />
                            )}
                          </div>

                          {/* Chat Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`truncate text-sm font-medium ${
                                  isCurrentRoom
                                    ? "text-blue-700"
                                    : "text-gray-800"
                                }`}
                              >
                                {room.name || privateRoomChatName(room)}
                              </p>
                              {room.lastMessage?.createdAt && (
                                <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(room.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {room.lastMessage?.content && (
                              <p className="mt-0.5 truncate text-xs text-gray-500">
                                {room.lastMessage.type === "text"
                                  ? room.lastMessage.content
                                  : room.lastMessage.type === "file"
                                    ? "Sent a file"
                                    : room.lastMessage.type === "image"
                                      ? "Sent an image"
                                      : "N/A"}
                              </p>
                            )}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>

            {roomsList.length > 10 && (
              <div className="mt-3 px-3">
                <Link
                  href="/chat"
                  className="block w-full rounded-lg bg-gray-100 px-3 py-2 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                  View all chats
                </Link>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
