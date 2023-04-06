import useApi from "./use-api";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * Verifies that the user is logged in. Redirects to / if not. Pass
 * `false` to verify that the user is _not_ logged in.
 */
export default function useLoggedIn(shouldBeLoggedIn = true) {
  const { user, token } = useApi();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const { next } = router.query;
  const emailVerificationMode =
    process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

  useEffect(() => {
    if (shouldBeLoggedIn === true) {
      if (!token) {
        setIsLoggedIn(false);
        router.replace("/");
      }
      if (emailVerificationMode && user?.emailValid === false) {
        router.replace("/verify");
      }
      if (user?.emailValid) {
        setIsLoggedIn(true);
      }
    }
    // Check for user rather than token so redirects to /dashboard.
    if (shouldBeLoggedIn === false && user) {
      if (emailVerificationMode && user.emailValid === false) {
        setIsLoggedIn(false);
        router.replace("/verify");
      } else {
        setIsLoggedIn(true);
        router.replace(next ? next.toString() : "/dashboard");
      }
    }
    if (shouldBeLoggedIn === false && !token) {
      setIsLoggedIn(false);
    }
  }, [user, token, next]);

  return isLoggedIn;
}
