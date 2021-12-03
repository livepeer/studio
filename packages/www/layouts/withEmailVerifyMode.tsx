import { useApi } from "hooks";
import Layout from "./dashboard";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const withEmailVerifyMode = (Component) => {
  return (props) => {
    const { user } = useApi();
    if (!user || (emailVerificationMode && user.emailValid === false)) {
      return <Layout />;
    }
    return <Component {...props} />;
  };
};

export { withEmailVerifyMode };
