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
import { Textarea } from "@/components/ui/textarea";
import { useCreateRoom } from "@/hooks/use-rooms";
import { useUploadImage } from "@/hooks/use-upload";
import { CreateRoom } from "@/types/room";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import z from "zod";
import {
  MessageSquarePlus,
  Upload,
  Users,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";

interface ChatHeaderProps {
  session: Session;
}

const schema = z.object({
  name: z
    .string()
    .min(1, "Room name is required.")
    .max(50, "Name must be 50 characters or less"),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(200, "Description must be 200 characters or less"),
  image: z.any(),
});

type CreateRoomForm = z.infer<typeof schema>;

function CreateRoomClient({ session }: ChatHeaderProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("image", null);
  };

  const onSubmit = useCallback(
    async (data: CreateRoomForm) => {
      try {
        let avatarUrl: string | undefined;

        if (data.image) {
          avatarUrl = await uploadImage(data.image![0]);

          if (!avatarUrl) {
            toast.error("Failed to upload image");
            return;
          }
        }

        const roomData: CreateRoom = {
          name: data.name,
          description: data.description,
          image: avatarUrl,
          members: [session.user.id],
          isPrivate: false,
          createdBy: session.user.id,
          createdAt: new Date(),
        };

        startTransition(async () => {
          try {
            const room = await createRoom(roomData);

            if (room) {
              toast.success("Room created successfully! 🎉");
              router.push(`/chat/${room._id}`);
            }
          } catch (error) {
            toast.error("Failed to create room");
            throw error;
          }
        });
      } catch (error) {
        console.error("Failed to create room:", error);
        toast.error("Failed to create room");
      }
    },
    [createRoom, router, session.user.id, startTransition, uploadImage],
  );

  const nameLength = form.watch("name")?.length || 0;
  const descriptionLength = form.watch("description")?.length || 0;

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="p-4">
          <ChatHeader session={session} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          {/* Back Button */}
          <button
            onClick={() => router.push("/chat")}
            className="group mb-6 flex items-center gap-2 text-gray-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-semibold">Back to Chats</span>
          </button>

          {/* Form Card */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
            {/* Header Section */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                <MessageSquarePlus className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Create New Room
              </h2>
              <p className="text-gray-600">
                Set up a new chat room and invite your friends
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Room Image Upload */}
                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-6">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <ImageIcon size={18} />
                          Room Image (Optional)
                        </FormLabel>
                        <div className="flex items-center gap-4">
                          {imagePreview ? (
                            <div className="group relative">
                              <Image
                                src={imagePreview}
                                alt="Room preview"
                                width={120}
                                height={120}
                                className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-lg"
                              />
                              <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg">
                              <Users className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <label
                              htmlFor="room-image"
                              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-blue-200 bg-white px-4 py-2.5 font-semibold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                            >
                              <Upload size={18} />
                              Choose Image
                            </label>
                            <Input
                              id="room-image"
                              type="file"
                              className="hidden"
                              accept="image/png, image/jpeg, image/jpg"
                              onChange={(e) => {
                                field.onChange(e.target.files);
                                handleImageChange(e);
                              }}
                            />
                            <p className="mt-2 text-xs text-gray-600">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                        <FormMessage className="mt-2 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Room Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between text-sm font-semibold text-gray-700">
                        <span className="flex items-center gap-2">
                          <Users size={18} />
                          Room Name
                        </span>
                        <span
                          className={`text-xs ${nameLength > 45 ? "text-orange-600" : "text-gray-500"}`}
                        >
                          {nameLength}/50
                        </span>
                      </FormLabel>
                      <Input
                        placeholder="Enter room name (e.g., Study Group, Team Chat)"
                        className="h-12 rounded-xl border-2 border-gray-200 transition-colors focus:border-blue-500"
                        maxLength={50}
                        {...field}
                      />
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Room Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between text-sm font-semibold text-gray-700">
                        <span className="flex items-center gap-2">
                          <FileText size={18} />
                          Description
                        </span>
                        <span
                          className={`text-xs ${descriptionLength > 180 ? "text-orange-600" : "text-gray-500"}`}
                        >
                          {descriptionLength}/200
                        </span>
                      </FormLabel>
                      <Textarea
                        placeholder="Describe the purpose of this room..."
                        className="min-h-[100px] resize-none rounded-xl border-2 border-gray-200 transition-colors focus:border-blue-500"
                        maxLength={200}
                        {...field}
                      />
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Info Box */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Room Settings:</span> Your
                      room will be created as public by default. You'll be
                      automatically added as the first member and can invite
                      others later.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <Button
                    variant="default"
                    className="h-12 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={
                      isUploading || form.formState.isSubmitting || isSubmitting
                    }
                  >
                    {isUploading || isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Room...
                      </>
                    ) : (
                      <>
                        <MessageSquarePlus className="mr-2 h-5 w-5" />
                        Create Room
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-xl border-2 border-gray-300 font-semibold transition-all duration-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      isUploading || form.formState.isSubmitting || isSubmitting
                    }
                    onClick={() => router.push("/chat")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Helper Text */}
          {/* <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Check out our{" "}
              <a
                href="#"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                room creation guide
              </a>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default CreateRoomClient;
