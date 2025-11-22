import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher/pusher-server";
import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);

    const socket_id = params.get("socket_id");
    const channel_name = params.get("channel_name");

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 },
      );
    }

    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isUserExists = await userService.getUserById(token.sub.toString());
    const authUser = token.sub;

    if (!isUserExists) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (channel_name.startsWith("private-")) {
      const allowedId = channel_name.replace("private-user-", "");

      if (allowedId !== authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (channel_name.startsWith("presence-")) {
      const auth = pusherServer.authorizeChannel(socket_id, channel_name, {
        user_id: token.sub,
        user_info: {
          name: token.name,
          avatar: token.picture,
        },
      });

      return NextResponse.json(auth);
    }

    const auth = pusherServer.authorizeChannel(socket_id, channel_name, {
      user_id: token.sub,
    });
    return NextResponse.json(auth);
  } catch (err) {
    console.error("[PUSHER AUTH ERROR]", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}
