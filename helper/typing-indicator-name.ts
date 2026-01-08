import { User } from "@/types/user";

function typingIndicatorName(user: User) {
  if (user.isAnonymous && user.role === "user") {
    return user.anonAlias || "Anonymous";
  } else if (user.isAnonymous && user.role === "anonymous") {
    return user.name || "Anonymous";
  } else {
    return user.name || "User";
  }
}

export default typingIndicatorName;
