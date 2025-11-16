import { Analytics } from "@vercel/analytics/next";
import GlobalPusherProvider from "./global-pusher-provider";
import QueryProvider from "./query-provider";
import AuthProvider from "./session-provider";
import { ToastProvider } from "./toast-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <QueryProvider>
        <AuthProvider>
          <GlobalPusherProvider />
          <ToastProvider />
          {children}
        </AuthProvider>
      </QueryProvider>
      {/* Next Providers */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default Providers;
