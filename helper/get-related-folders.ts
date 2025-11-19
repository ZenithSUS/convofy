import { baseFolder } from "@/constants/base";

/**
 * Returns the folder paths related to a specific user for deletion.
 *
 * @param userId - the ID of the user
 * @param roomIds - optional list of room IDs to delete user media/messages from
 * @returns string[] - array of folder paths
 */
function getUserRelatedFolders(
  userId: string,
  roomIds: string[] = [],
): string[] {
  const folders: string[] = [];

  // User personal media
  folders.push(`${baseFolder}/users/${userId}/media`);

  // Room-specific media/messages
  roomIds.forEach((roomId) => {
    folders.push(`${baseFolder}/rooms/${roomId}/media/${userId}`);
    folders.push(`${baseFolder}/rooms/${roomId}/messages/${userId}`);
  });

  return folders;
}

export default getUserRelatedFolders;
