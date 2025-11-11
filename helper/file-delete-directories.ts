type FileDirectoryType =
  | "avatar"
  | "userMedia"
  | "roomMedia"
  | "message"
  | "misc";

/**
 * Returns the Cloudinary folder path to delete based on the file type and optional IDs.
 *
 * Mirrors the logic of getFileDirectory().
 *
 * @param {FileDirectoryType} type - The type of file directory to delete.
 * @param {string} [id] - The user or room ID.
 * @param {string} [parentId] - The parent room ID for room-based files.
 * @returns {string} The folder path to delete.
 */
function getFolderToDelete(
  type: FileDirectoryType,
  id?: string,
  parentId?: string,
): string {
  switch (type) {
    case "avatar":
      // Delete all avatars (or a single user folder if id is provided)
      return id ? `users/${id}/avatar` : "users/avatar";

    case "userMedia":
      return id ? `users/${id}/media` : "users/unknown";

    case "roomMedia":
      return parentId && id ? `rooms/${parentId}/media/${id}` : "rooms/unknown";

    case "message":
      return parentId && id
        ? `rooms/${parentId}/messages/${id}`
        : "rooms/unknown";

    case "misc":
    default:
      return "global/misc";
  }
}

export default getFolderToDelete;
