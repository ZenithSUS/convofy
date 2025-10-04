"use client";

import ChatHeader, { Session } from "@/app/(views)/chat/components/chat-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateRoom } from "@/hooks/use-rooms";
import { useUploadImage } from "@/hooks/use-upload";
import { CreateRoom } from "@/types/room";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import z from "zod";

interface ChatHeaderProps {
  session: Session;
}

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  image: z.any(),
});

type CreateRoomForm = z.infer<typeof schema>;

function CreateRoomForm({ session }: ChatHeaderProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const { uploadImage, isUploading } = useUploadImage();
  const { mutateAsync: createRoom } = useCreateRoom();

  const form = useForm<CreateRoomForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      image: null,
    },
  });

  const onSubmit = useCallback(async (data: CreateRoomForm) => {
    try {
      let avatarUrl: string | undefined;

      if (data.image) {
        avatarUrl = await uploadImage(data.image![0]);

        if (!avatarUrl) {
          toast.error("Failed to upload avatar");
          return;
        }
      }

      const roomData: CreateRoom = {
        name: data.name,
        description: data.description,
        image: avatarUrl,
        members: [session.user.id],
        createdBy: session.user.id,
        createdAt: new Date(),
      };

      startTransition(async () => {
        try {
          const room = await createRoom(roomData);

          if (room) {
            toast.success("Room created successfully");
            router.push(`/chat/${room._id}`);
          }
        } catch (error) {
          toast.error("Failed to Create room");
          throw error;
        }
      });
    } catch (error) {
      console.error("Failed to Create room:", error);
      toast.error("Failed to Create room");
    }
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <ChatHeader session={session} />
        {/* Create Room Form */}
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <h2 className="mb-2 text-2xl font-semibold">Create Room</h2>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <Input placeholder="Room name" {...field} />

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <Input placeholder="Room Description" {...field} />

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image (optional)</FormLabel>
                  <Input
                    type="file"
                    {...field}
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => field.onChange(e.target.files)}
                    onBlur={field.onBlur}
                    value={undefined}
                  />

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button
                className="group relative flex-1 cursor-pointer justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 ease-in-out hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                type="submit"
                disabled={isUploading || form.formState.isSubmitting}
              >
                Submit
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() => router.push("/chat")}
                className="flex-1 cursor-pointer bg-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default CreateRoomForm;
