"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import ProfileHeader from "@/app/(views)/chat/profile/components/profile-header";
import AvatarCard from "@/app/(views)/chat/profile/components/avatar-card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";
import { Input } from "@/components/ui/input";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useUploadImage } from "@/hooks/use-upload";
import { useDeleteFile } from "@/hooks/use-delete-file";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Upload, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { extractPublicId } from "cloudinary-build-url";
import { useUpdateUser } from "@/hooks/use-user";
import { toast } from "react-toastify";
import { User as UserType } from "@/types/user";
import { useRouter } from "next/navigation";
import useHybridSession from "@/hooks/use-hybrid-session";
import Loading from "@/components/ui/loading";

const editFormSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    avatar: z.any().optional(),
  })
  .refine((data) => {
    if (!data.avatar || !data.avatar[0]) return true;
    return data.avatar[0].size <= 5000000;
  }, "Avatar size must be less than 5MB.");

type FormData = z.infer<typeof editFormSchema>;

function EditPageClient({ serverSession }: { serverSession: Session }) {
  const { update, session, isLoading } = useHybridSession(serverSession);

  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: session.user.name,
      avatar: undefined,
    },
  });

  const { name, avatar } = useWatch({ control: form.control });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const { uploadImage, isUploading } = useUploadImage();
  const { deleteFile, isDeleting } = useDeleteFile();

  const isAnyFileUploading = useMemo(
    () => isUploading || isDeleting || isUpdating,
    [isUploading, isDeleting, isUpdating],
  );

  const isAnyChange = useMemo(() => {
    const hasNameChange = name !== session.user.name;
    const hasAvatarChange = avatar && avatar.length > 0;
    return hasNameChange || hasAvatarChange;
  }, [name, avatar, session.user.name]);

  const isGoogleAvatar = useMemo(() => {
    return session.user.image?.includes("google");
  }, [session.user.image]);

  useEffect(() => {
    if (session.user.image) {
      setAvatarPreview(session.user.image);
    }
  }, [session.user.image]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      setFormError(null);
      if (!isAnyChange) return;

      try {
        let avatarUrl: string | undefined = undefined;
        let oldAvatarPublicId: string | null = null;

        // Upload new avatar if provided
        if (data.avatar && data.avatar.length > 0) {
          avatarUrl = await uploadImage(data.avatar[0]);

          if (!avatarUrl) {
            setFormError("Failed to upload avatar");
            return;
          }

          // Store old avatar public ID for deletion (if not Google avatar)
          if (!isGoogleAvatar && session.user.image) {
            oldAvatarPublicId = extractPublicId(session.user.image);
          }
        }

        const userData: Partial<UserType> = {
          _id: session.user.id,
          name: data.name,
          ...(avatarUrl && { avatar: avatarUrl }),
        };

        const updatedUser = await updateUser(userData).catch(async (err) => {
          console.error("Error updating user:", err);
          if (avatarUrl) await deleteFile(avatarUrl);
          throw err;
        });

        await update({
          ...session,
          user: {
            ...session.user,
            name: updatedUser.name,
            image: updatedUser.avatar || session.user.image,
          },
        });

        // Delete old avatar after successful update
        if (oldAvatarPublicId) {
          await deleteFile(oldAvatarPublicId).catch((err) => {
            console.error("Error deleting old avatar:", err);
          });
        }

        // Reset form with new values
        form.reset({
          name: updatedUser.name,
          avatar: undefined,
        });

        toast.success("Profile updated successfully");
        router.refresh();
      } catch (error) {
        console.error(error);
        setFormError("An error occurred while editing profile.");
      }
    },
    [
      session,
      isAnyChange,
      isGoogleAvatar,
      uploadImage,
      deleteFile,
      updateUser,
      form,
      update,
      router,
    ],
  );

  const handleAvatarChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  if (!session) return null;

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading text="Please wait" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Background */}
      <ProfileHeader
        userId={session.user.id}
        sessionId={session.user.sessionId}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8">
        <AvatarCard session={session} name="Edit Information" />

        {/* Edit Form */}
        <div className="space-y-8 rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-4"
            >
              {/* Avatar Upload */}
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor="avatar"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Profile Picture
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {avatarPreview ? (
                            <Image
                              src={avatarPreview}
                              alt="Avatar preview"
                              width={80}
                              height={80}
                              priority
                              className="h-20 w-20 rounded-full border-4 border-blue-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-gray-100 bg-gradient-to-br from-gray-100 to-gray-200">
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="avatar"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-600 transition-colors hover:bg-blue-100"
                          >
                            <Upload className="h-4 w-4" />
                            Choose Image
                          </label>
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                            onChange={(e) => {
                              field.onChange(e.target.files);
                              handleAvatarChange(e);
                            }}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            JPG, PNG (Max 5MB)
                          </p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className="text-sm font-semibold text-gray-700"
                      id="name"
                    >
                      Name
                    </FormLabel>
                    <div className="relative">
                      <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Enter your name"
                        type="text"
                        autoComplete="off"
                        className="h-12 rounded-xl border-2 border-gray-200 pl-10 transition-colors focus:border-blue-500"
                        {...field}
                      />
                    </div>
                    <FormControl />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="disabled:opacity-50"
                disabled={isAnyFileUploading || !isAnyChange}
              >
                {isAnyFileUploading ? "Saving..." : "Save"}
              </Button>

              {formError && (
                <p className="text-center text-sm text-red-600">{formError}</p>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default EditPageClient;
