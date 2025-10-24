import {
  EditIcon,
  FileImageIcon,
  LockIcon,
  SearchIcon,
  User2Icon,
} from "lucide-react";

export const profileSettings = [
  {
    name: "Edit Profile",
    description: "Update your personal information",
    icon: <EditIcon size={20} />,
    href: "#",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Search Messages",
    description: "Find conversations quickly",
    icon: <SearchIcon size={20} />,
    href: "/chat/profile/messages",
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Privacy & Security",
    description: "Manage your privacy settings",
    icon: <LockIcon size={20} />,
    href: "#",
    color: "from-green-500 to-green-600",
  },
  {
    name: "Media & Files",
    description: "View shared photos and files",
    icon: <FileImageIcon size={20} />,
    href: "/chat/profile/media",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "Account Settings",
    description: "Manage your account preferences",
    icon: <User2Icon size={20} />,
    href: "#",
    color: "from-pink-500 to-pink-600",
  },
];

export default profileSettings;
