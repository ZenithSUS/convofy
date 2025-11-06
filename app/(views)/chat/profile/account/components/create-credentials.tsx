import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { SetStateAction, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import PasswordStrength from "@/helper/password-strength";
import { CreateLinkedAccount, UserOAuthProviders } from "@/types/user";
import { useLinkUserCredentials } from "@/hooks/use-user";
import { toast } from "react-toastify";
import useHybridSession from "@/hooks/use-hybrid-session";

interface Props {
  isGoogleAuth: boolean;
  session: Session;
  children: React.ReactNode;
  setIsConnecting: React.Dispatch<
    SetStateAction<Record<UserOAuthProviders, boolean>>
  >;
}

const createCredentialsSchema = z
  .object({
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long.")
      .max(50, "Password must be less than 50 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type createCredentialsSchemaType = z.infer<typeof createCredentialsSchema>;

function CreateCredentials({
  children,
  session,
  isGoogleAuth,
  setIsConnecting,
}: Props) {
  const { update } = useHybridSession(session);
  const form = useForm<createCredentialsSchemaType>({
    resolver: zodResolver(createCredentialsSchema),
    defaultValues: {
      email: session?.user.email || "",
      password: "",
      confirmPassword: "",
    },
  });
  const [isLinking, setIsLinking] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const password = form.watch("password") || "";
  const { strengthScore, strengthLabel, strengthColor } =
    PasswordStrength(password);

  const { mutateAsync: linkAccount } = useLinkUserCredentials();

  const onSubmit = useCallback(
    async (data: createCredentialsSchemaType) => {
      if (!session) return;

      try {
        setIsConnecting((prev) => ({ ...prev, credentials: true }));
        setIsLinking(true);
        setApiError(null);
        const user: CreateLinkedAccount = {
          id: session.user.id,
          credentials: {
            email: data.email,
            password: data.password,
          },
          linkedAccount: {
            provider: "credentials",
            providerAccount: data.email,
            providerAccountId: session.user.id,
          },
        };

        await linkAccount(user).catch((err) => {
          setApiError(err.response.data);
          throw err;
        });

        // Update the provider and linked account
        update({
          user: {
            ...session.user,
            linkedAccounts: [
              ...session.user.linkedAccounts,
              {
                provider: "credentials",
                providerAccount: data.email,
                providerAccountId: session.user.id,
              },
            ],
          },
        });

        toast.success("User credentials linked successfully");
      } catch (error) {
        console.error("Error linking user credentials:", error);
        toast.error("Failed to link user credentials");
      } finally {
        setIsLinking(false);
        setIsConnecting((prev) => ({ ...prev, credentials: false }));
      }
    },
    [session, linkAccount, update, setIsConnecting],
  );

  if (!session) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-4 text-center text-2xl font-bold">
            Create Credentials
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <Input
                              type="email"
                              autoComplete="email"
                              placeholder="Enter your email"
                              disabled={isGoogleAuth}
                              className="h-12 rounded-xl border-2 pl-10 text-sm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="relative">
                              <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                              <Input
                                type={
                                  showPassword.password ? "text" : "password"
                                }
                                autoComplete="new-password"
                                placeholder="Create a password"
                                className="h-12 rounded-xl border-2 pr-10 pl-10 text-sm"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword((prev) => ({
                                    ...prev,
                                    password: !prev.password,
                                  }))
                                }
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword.password ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>

                            {/* Strength Bar */}
                            {password.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                      key={i}
                                      className={`h-1 flex-1 rounded-full ${
                                        i <= strengthScore
                                          ? strengthColor
                                          : "bg-gray-200"
                                      }`}
                                    ></div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {strengthLabel}
                                </p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <Input
                              type={
                                showPassword.confirmPassword
                                  ? "text"
                                  : "password"
                              }
                              autoComplete="new-password"
                              placeholder="Confirm your password"
                              className="h-12 rounded-xl border-2 pr-10 pl-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((prev) => ({
                                  ...prev,
                                  confirmPassword: !prev.confirmPassword,
                                }))
                              }
                              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword.confirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={!form.formState.isValid || isLinking}
                    className="w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-8 py-6 text-base font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isLinking ? "Linking..." : "Link Account"}
                  </Button>

                  {apiError && <p className="text-red-500">{apiError}</p>}
                </form>
              </Form>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default CreateCredentials;
