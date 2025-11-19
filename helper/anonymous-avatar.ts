import anonymousName from "./anonymous-name";

function generateAnonymousAvatar(alias?: string) {
  if (!alias) {
    alias = anonymousName();
  }

  return `https://api.dicebear.com/9.x/identicon/png?seed=${encodeURIComponent(
    alias,
  )}&backgroundColor=800080`;
}

export default generateAnonymousAvatar;
