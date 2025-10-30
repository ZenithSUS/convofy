const getErrorMessage = (errorCode: string | null, error: string | null) => {
  switch (errorCode) {
    case "Configuration":
      return {
        title: "Configuration Error",
        description:
          "There is a problem with the server configuration. Please contact support.",
      };
    case "AccessDenied":
      return {
        title: "Access Denied",
        description: "You do not have permission to sign in.",
      };
    case "Verification":
      return {
        title: "Verification Failed",
        description:
          "The sign in link is no longer valid. It may have expired or already been used.",
      };
    case "OAuthAccountNotLinked":
    case "OAuthAccountAlreadyLinked":
      return {
        title: "Account Already Linked",
        description:
          "This Google account is already linked to a different user account. Please use a different Google account or sign in with your existing credentials.",
      };
    case "OAuthCallback":
      return {
        title: "OAuth Error",
        description:
          "There was a problem connecting your account. The account may already be linked to another user.",
      };
    case "Default":
    default:
      return {
        title: "Authentication Error",
        description:
          error?.includes("already linked") ||
          error?.includes("OAuthAccountAlreadyLinked")
            ? "This Google account is already linked to another user. Please use a different account or sign in with your existing credentials."
            : "Unable to sign in. Please try again or contact support if the problem persists.",
      };
  }
};

export default getErrorMessage;
