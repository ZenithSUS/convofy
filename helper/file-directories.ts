type FileDirectoryType =
  | "avatar"
  | "userMedia"
  | "roomMedia"
  | "message"
  | "misc";

/**
 * Returns a file directory path based on the given type and optional id and parentId.
 *
 * The following types are supported:
 * - avatar: Returns a directory path for user avatars.
 * - userMedia: Returns a directory path for media uploaded by a specific user.
 * - roomMedia: Returns a directory path for room-level shared files.
 * - message: Returns a directory path for message-specific attachments inside a room.
 * - misc: Returns a directory path for miscellaneous files.
 *
 * If id or parentId is not provided, the function returns a default path.
 * @param {FileDirectoryType} type - The type of file directory to return.
 * @param {string} [id] - The user or room ID to use in the directory path.
 * @param {string} [parentId] - The parent ID of the room to use in the directory path.
 * @returns {string} The file directory path.
 */
function getFileDirectory(
  type: FileDirectoryType,
  id?: string,
  parentId?: string,
): string {
  switch (type) {
    case "avatar":
      return "users/avatar";

    case "userMedia":
      // For media uploaded by a specific user
      return id ? `users/${id}/media` : "users/unknown";

    case "roomMedia":
      // For room-level shared files
      return parentId && id ? `rooms/${parentId}/media/${id}` : "rooms/unknown";

    case "message":
      // For message-specific attachments inside a room
      return parentId && id
        ? `rooms/${parentId}/messages/${id}`
        : "rooms/unknown";

    case "misc":
    default:
      return "global/misc";
  }
}

export default getFileDirectory;
