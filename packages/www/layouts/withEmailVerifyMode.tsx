import { useApi } from "hooks";
import { useRouter } from "next/navigation";
import React from "react";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const withEmailVerifyMode = <TProps,>(Component: React.FC<TProps>) => {
  return (props: TProps) => {
    const { user } = useApi();
    const router = useRouter();
    if (emailVerificationMode && user.emailValid === false) {
      router.replace("/verify");
    }

    return <Component {...props} />;
  };
};

export { withEmailVerifyMode };
