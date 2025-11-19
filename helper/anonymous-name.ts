import { convofyAdjectives, convofyNouns } from "@/constants/anonymous-names";

function anonymousName(): string {
  const adj =
    convofyAdjectives[Math.floor(Math.random() * convofyAdjectives.length)];
  const noun = convofyNouns[Math.floor(Math.random() * convofyNouns.length)];
  const num = Math.floor(Math.random() * 900 + 100); // 100–999
  return `${adj}${noun}${num}`;
}

export default anonymousName;
