import { useApi } from "hooks";
import { useRouter } from "next/router";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const withEmailVerifyMode = (Component) => {
  return (props) => {
    const { user } = useApi();
    const router = useRouter();
    if (emailVerificationMode && user.emailValid === false) {
      router.replace("/verify");
    }

    return <Component {...props} />;
  };
};

export { withEmailVerifyMode };
