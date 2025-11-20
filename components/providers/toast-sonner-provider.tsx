import { Toaster } from "sonner";

function ToastSonnerProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        closeButton
        theme="system"
        className="bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      />
      {children}
    </>
  );
}

export default ToastSonnerProvider;
