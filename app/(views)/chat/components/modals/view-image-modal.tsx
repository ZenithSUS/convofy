import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";

interface ViewImageModalProps {
  content: string;
  user: string;
  children?: React.ReactNode;
}

function ViewImageModal({ children, content, user }: ViewImageModalProps) {
  return (
    <Dialog>
      <DialogTrigger className="flex justify-center">{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">
            {user.split(" ")[0]}&apos;s Image
          </DialogTitle>
          <DialogDescription>
            <Link
              href={content}
              download
              target="_blank"
              rel="noopener nooreferrer"
            >
              <Image
                src={content}
                alt="User Image"
                width={500}
                height={500}
                className="max-h-[500px] w-full object-contain transition-all hover:scale-105 active:scale-95"
                priority
              />
            </Link>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default ViewImageModal;
