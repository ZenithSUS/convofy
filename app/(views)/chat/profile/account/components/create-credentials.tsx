import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { DialogTitle } from "@radix-ui/react-dialog";

interface Props {
  session: Session;
  children: React.ReactNode;
}

function CreateCredentials({ children, session }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {session.user.name}
          </DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default CreateCredentials;
