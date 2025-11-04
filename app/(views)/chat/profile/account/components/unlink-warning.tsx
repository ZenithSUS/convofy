import { Session } from "@/app/(views)/chat/components/chat-header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import useHybridSession from "@/hooks/use-hybrid-session";
import { UserLinkedAccount, UserOAuthProviders } from "@/types/user";
import { toast } from "react-toastify";

interface UnlinkWarningProps {
  session: Session;
  children: React.ReactNode;
  unlinkAuth: (data: {
    id: string;
    accountType: UserLinkedAccount;
  }) => Promise<void>;
  isUnlinking: boolean;
  setError: (error: string | null) => void;
  provider: string;
}

function UnlinkWarning({
  children,
  session,
  unlinkAuth,
  isUnlinking,
  setError,
  provider,
}: UnlinkWarningProps) {
  const { update } = useHybridSession(session);

  const handleUnlink = async (provider: string) => {
    try {
      setError(null);

      const account = session.user.linkedAccounts.find(
        (account) => account.provider === provider,
      );

      if (!account || isUnlinking || !session.user.id) return;

      const accountData: UserLinkedAccount = {
        provider: account.provider as UserOAuthProviders,
        providerAccount: account.providerAccount,
        providerAccountId: account.providerAccountId,
      };

      await unlinkAuth({
        id: session.user.id,
        accountType: accountData,
      });

      update({
        user: {
          ...session.user,
          linkedAccounts: session.user.linkedAccounts.filter(
            (account) => account.provider !== provider,
          ),
        },
      });

      toast.success("Account unlinked successfully!");
    } catch (err) {
      console.error("Unlink error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  if (!session.user.linkedAccounts.length) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to unlink?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="font-semibold text-red-500">
          This will unlink your {provider} account.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-600"
            onClick={() => handleUnlink(provider)}
          >
            Unlink
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default UnlinkWarning;
