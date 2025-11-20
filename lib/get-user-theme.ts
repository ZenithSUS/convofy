import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

async function getUserTheme(): Promise<"light" | "dark"> {
  const session = await getServerSession(authOptions).catch(() => null);

  return session?.user?.preferences?.theme || "light";
}

export default getUserTheme;
