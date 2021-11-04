import useApi from "./use-api";
import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Verifies that the user is logged in. Redirects to /login if not. Pass
 * `false` to verify that the user is _not_ logged in.
 */
export default (shouldBeLoggedIn = true) => {
  const { user, token } = useApi();
  const router = useRouter();
  const { next } = router.query;

  useEffect(() => {
    if (shouldBeLoggedIn === true) {
      if (!token) {
        router.replace("/login");
      } else if (user) {
        router.replace("/dashboard");
      }
    }
    // Check for user rather than token so redirects to /dashboard.
    if (shouldBeLoggedIn === false && user) {
      router.replace(next ? next.toString() : "/dashboard");
    }
  }, [user, token, next]);
};
