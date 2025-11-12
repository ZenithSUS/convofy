import { useMemo } from "react";

function PasswordStrength(password: string) {
  /**
   * Calculate password strength
   * Returns a score from 0–4 and label: weak / fair / good / strong
   */
  const { strengthScore, strengthLabel, strengthColor } = useMemo(() => {
    let score = 0;

    if (/[a-z]/.test(password)) score++; // lowercase
    if (/[A-Z]/.test(password)) score++; // uppercase
    if (/\d/.test(password)) score++; // number
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++; // special char
    if (password.length >= 12) score++; // long password bonus

    let label = "Weak password";
    let color = "bg-red-500";

    if (score >= 4) {
      label = "Strong password";
      color = "bg-green-500";
    } else if (score === 3) {
      label = "Good password";
      color = "bg-yellow-500";
    } else if (score === 2) {
      label = "Fair password";
      color = "bg-orange-500";
    }

    return { strengthScore: score, strengthLabel: label, strengthColor: color };
  }, [password]);

  return { strengthScore, strengthLabel, strengthColor };
}

export default PasswordStrength;
