import useApi from "./use-api";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useJune, events } from "hooks/use-june";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

/**
 * Verifies that the user is logged in. Redirects to / if not. Pass
 * `false` to verify that the user is _not_ logged in.
 */
export default function useLoggedIn(shouldBeLoggedIn = true) {
  const { user, token } = useApi();
  const router = useRouter();
  const June = useJune();
  const { next } = router.query;

  const trackEvent = useCallback(
    (user) => {
      if (June)
        June?.identify(user.id, {
          email: user.email,
        });
    },
    [June]
  );

  useEffect(() => {
    if (shouldBeLoggedIn === true) {
      if (!token) {
        router.replace("/login");
      } else if (emailVerificationMode && user?.emailValid === false) {
        router.replace("/verify");
      }
    }
    // console.log(shouldBeLoggedIn, user);
    // Check for user rather than token so redirects to /dashboard.
    if (shouldBeLoggedIn === false && user) {
      if (process.env.NODE_ENV === "production") {
        trackEvent(user);
      }
      if (emailVerificationMode && user.emailValid === false) {
        router.replace("/verify");
      } else {
        router.replace(next ? next.toString() : "/");
      }
    }
  }, [user, token, next]);
}
