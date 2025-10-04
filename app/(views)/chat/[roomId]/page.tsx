"use client";

import { useMemo, useTransition } from "react";
import { useParams } from "next/navigation";
import RoomHeader from "../components/room-header";
import { useGetRoomById } from "@/hooks/use-rooms";
import { Room } from "@/types/room";
import { CreateMessage, Message } from "@/types/message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetMessagesByRoom, useSendMessage } from "@/hooks/use-message";
import { useSession } from "next-auth/react";

const schema = z.object({
  message: z.string().min(1, "Message is required."),
});

type FormData = z.infer<typeof schema>;

function RoomPage() {
  const { roomId } = useParams();
  const { data: session } = useSession();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: "",
    },
  });

  const [isSending, startTransition] = useTransition();
  const { data: room } = useGetRoomById(roomId as string);
  const { data: messages } = useGetMessagesByRoom(roomId as string);
  const { mutateAsync: sendMessage } = useSendMessage();

  const roomData = useMemo(() => room, [room]);
  const isAllDataLoaded = useMemo(() => {
    return roomData && messages;
  }, [roomData, messages]);

  const handleSendMessage = async (data: FormData) => {
    if (data.message.trim() === "") return;

    const messageData: CreateMessage = {
      sender: session?.user?.id!,
      room: roomId as string,
      content: data.message,
      type: "text",
    };

    startTransition(async () => {
      try {
        await sendMessage(messageData);

        form.reset();
      } catch (error) {
        console.error(error);
        throw error;
      }
    });
  };

  if (!isAllDataLoaded)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Room Header */}
        <RoomHeader room={roomData as Room} />

        {messages?.length === 0 && <p>No messages yet.</p>}
        {messages?.map((msg: Message) => {
          return (
            <div
              key={msg._id}
              className={`mb-4 w-fit rounded-md ${msg.sender._id === session?.user?.id ? "ml-auto bg-slate-200 p-2 dark:bg-slate-800" : "mr-auto bg-slate-300 p-2 dark:bg-slate-700"}`}
            >
              <strong>{msg.sender.name.split(" ")[0]}:</strong> {msg.content}
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form
          className="flex gap-2 border-t p-4"
          onSubmit={form.handleSubmit(handleSendMessage)}
        >
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1 items-center">
                <FormLabel className="sr-only">Message</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Type a message..."
                    className="mr-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSending}
          >
            Send
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default RoomPage;
