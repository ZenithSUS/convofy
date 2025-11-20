import { Analytics } from "@vercel/analytics/next";
import GlobalPusherProvider from "./global-pusher-provider";
import QueryProvider from "./query-provider";
import AuthProvider from "./session-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ToastSonnerProvider from "./toast-sonner-provider";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <QueryProvider>
        <AuthProvider>
          <GlobalPusherProvider />
          <ToastSonnerProvider>{children}</ToastSonnerProvider>
        </AuthProvider>
      </QueryProvider>
      {/* Next Providers */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default Providers;
