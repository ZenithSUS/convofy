import roomService from "@/services/mongodb/room.service";
import { CreateRoom } from "@/types/room";
import { getUserToken } from "@/lib/utils";
import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";
import roomCreateLimit from "@/lib/redis/redis-room-create-limit";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { escapeRegex } from "@/helper/escape-regex";

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    // Rate limiting
    const {
      success,
      limit: rateLimit,
      remaining,
      reset,
    } = await messageFetchLimit.limit(userId);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // Parse and validate query parameter
    const url = new URL(req.url);
    const queryParam = url.searchParams.get("query")?.trim() || "";

    // Validate search query if provided
    if (queryParam && queryParam.length > 100) {
      return NextResponse.json(
        { error: "Search query too long (max 100 characters)" },
        { status: 400 },
      );
    }

    // Sanitize query to prevent NoSQL injection
    const sanitizedQuery = escapeRegex(queryParam);

    // Get rooms where user is a member
    const rooms = await roomService.getUserRooms(userId, sanitizedQuery);

    return NextResponse.json(rooms, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-Total-Count": rooms.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    // Rate Limiting
    const {
      success,
      limit: rateLimit,
      remaining,
      reset,
    } = await roomCreateLimit.limit(userId);

    if (!success) {
      return NextResponse.json(
        { error: "Too many room creation attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // Parse and validate request body
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Validate room name (required)
    if (!data.name || typeof data.name !== "string") {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 },
      );
    }

    const trimmedName = data.name.trim();

    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Room name cannot be empty" },
        { status: 400 },
      );
    }

    if (trimmedName.length < 3) {
      return NextResponse.json(
        { error: "Room name must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Room name too long (max 100 characters)" },
        { status: 400 },
      );
    }

    // Validate description (optional)
    let description = "";
    if (data.description) {
      if (typeof data.description !== "string") {
        return NextResponse.json(
          { error: "Description must be a string" },
          { status: 400 },
        );
      }
      description = data.description.trim().slice(0, 500); // Max 500 chars
    }

    // Validate image URL (optional)
    let image: string | undefined;
    if (data.image) {
      if (typeof data.image !== "string") {
        return NextResponse.json(
          { error: "Image must be a string URL" },
          { status: 400 },
        );
      }

      const trimmedImage = data.image.trim();

      // Basic URL validation
      try {
        new URL(trimmedImage);
        if (trimmedImage.length > 500) {
          return NextResponse.json(
            { error: "Image URL too long (max 500 characters)" },
            { status: 400 },
          );
        }
        image = trimmedImage;
      } catch {
        return NextResponse.json(
          { error: "Invalid image URL format" },
          { status: 400 },
        );
      }
    }

    // Validate and process members
    const members: string[] = [userId]; // Creator is always a member

    if (data.members) {
      if (!Array.isArray(data.members)) {
        return NextResponse.json(
          { error: "Members must be an array" },
          { status: 400 },
        );
      }

      // Validate member count
      if (data.members.length > 100) {
        return NextResponse.json(
          { error: "Too many members (max 100)" },
          { status: 400 },
        );
      }

      // Validate each member ID
      for (const memberId of data.members) {
        const memberIdStr =
          typeof memberId === "string" ? memberId : memberId?.toString();

        if (!memberIdStr || !ObjectId.isValid(memberIdStr)) {
          return NextResponse.json(
            { error: `Invalid member ID: ${memberIdStr}` },
            { status: 400 },
          );
        }

        // Don't add duplicates
        if (!members.includes(memberIdStr)) {
          members.push(memberIdStr);
        }
      }
    }

    // Validate isPrivate (optional, defaults to true)
    const isPrivate =
      data.isPrivate !== undefined ? Boolean(data.isPrivate) : true; // Default to private

    // Check user's room count limit
    const userRoomCount = await roomService.getUserRoomCount(userId);
    if (userRoomCount >= 100) {
      return NextResponse.json(
        { error: "Room limit reached. You can create maximum 100 rooms." },
        { status: 403 },
      );
    }

    // For direct messages (2 members), check if room already exists
    if (members.length === 2) {
      const existingRoom = await roomService.findDirectRoom(members);
      if (existingRoom) {
        return NextResponse.json(
          {
            message: "Direct message room already exists",
            room: existingRoom,
          },
          { status: 200 }, // Return existing room instead of error
        );
      }
    }

    // Prepare room data according to CreateRoom type
    const roomData: CreateRoom = {
      name: trimmedName,
      description,
      image,
      members,
      isPrivate,
      owner: userId, // Creator is the owner
      createdAt: new Date(),
      isAnonymous: false,
    };

    // Create room
    const newRoom = await roomService.createRoom(roomData);

    return NextResponse.json(newRoom, {
      status: 201,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate")) {
        return NextResponse.json(
          { error: "A room with this name already exists" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
