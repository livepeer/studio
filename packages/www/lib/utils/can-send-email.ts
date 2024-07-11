/*
 * Function to check if a user can request reset password or verfication email
 */

export function canSendEmail(emailType: "resetPassword" | "verifyEmail"): {
  canSend: boolean;
  waitTime: number;
} {
  const lastSentKey: string = `lastSent_${emailType}`;
  const lastSentTimestamp: string | null = localStorage.getItem(lastSentKey);

  if (lastSentTimestamp) {
    const currentTime: number = getCurrentTimestamp();
    const timeDiff: number = currentTime - parseInt(lastSentTimestamp, 10);

    if (timeDiff < 30) {
      // If less than 30 seconds have passed, do not allow sending the email
      const waitTime: number = 30 - timeDiff;
      return {
        canSend: false,
        waitTime,
      };
    }
  }

  const newSentKey: string = `lastSent_${emailType}`;
  localStorage.setItem(newSentKey, getCurrentTimestamp().toString());
  return {
    canSend: true,
    waitTime: 0,
  };
}

function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
