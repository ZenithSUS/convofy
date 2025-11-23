import { TrophySpin } from "react-loading-indicators";

function MatchLoading({ theme }: { theme?: string }) {
  return (
    <TrophySpin
      color="#2659d0"
      size="medium"
      text="Redirecting to room..."
      textColor={theme === "dark" ? "#ffffff" : "#000000"}
    />
  );
}

export default MatchLoading;
