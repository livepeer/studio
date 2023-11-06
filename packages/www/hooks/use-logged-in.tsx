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
        router.replace("/login");
      } else if (emailVerificationMode && user && user.emailValid === false) {
        router.replace("/verify");
      }
    }
    console.log(shouldBeLoggedIn, user);
    // Check for user rather than token so redirects to /dashboard.
    if (shouldBeLoggedIn === false && user) {
      console.log("reached");
      if (emailVerificationMode && user.emailValid === false) {
        router.replace("/verify");
      } else {
        console.log("what");
        router.replace(next ? next.toString() : "/dashboard");
      }
    }
  }, [user, token, next]);

  return isLoggedIn;
}
