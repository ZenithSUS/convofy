import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

function DeleteAccount() {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);

    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Account deleted successfully");
      // Redirect to home
    } catch (error) {
      toast.error("Failed to delete account");
      console.error("Error deleting account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-1 h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Delete Account</h3>
            <p className="mt-1 text-sm text-gray-600">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="h-10 w-full rounded-lg font-semibold"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Delete Account Permanently
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account Permanently
            </DialogTitle>
            <DialogDescription>
              This action is irreversible. All your data, messages, and settings
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This will permanently delete:
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>All your messages</li>
                <li>All your media files</li>
                <li>Your profile information</li>
                <li>Your account settings</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4 py-4">
            <div>
              <Label
                htmlFor="delete-confirmation"
                className="text-sm font-semibold"
              >
                Type <span className="font-mono font-bold">DELETE</span> to
                confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="mt-1 h-11 rounded-xl border-2"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== "DELETE"}
              variant="destructive"
              className="h-10 rounded-lg font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete My Account Forever"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DeleteAccount;
