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

interface SessionRemoveWarningProps {
  children: React.ReactNode;
  handleRemoveSession: () => void;
  description: string;
}

function SessionRemoveWarning({
  children,
  handleRemoveSession,
  description,
}: SessionRemoveWarningProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to remove your session?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="font-semibold text-red-500">
          {description}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-600"
            onClick={() => handleRemoveSession()}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SessionRemoveWarning;
