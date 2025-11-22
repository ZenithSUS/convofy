import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

function useHybridSession(serverSession: Session) {
  const { data: clientSession, status, update } = useSession();

  const session = useMemo<Session>(() => {
    if (clientSession) return clientSession as unknown as Session;
    return serverSession;
  }, [serverSession, clientSession]);

  const isClientSession = useMemo(
    () => clientSession !== null && clientSession !== undefined,
    [clientSession],
  );

  return {
    session,
    isClientSession,
    isLoading: status === "loading",
    update,
  };
}

export default useHybridSession;
