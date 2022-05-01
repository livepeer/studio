import React from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const withRecaptcha = (Component) => {
  const Recaptcha = ({ children }) => {
    return (
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
        language="en">
        {children}
      </GoogleReCaptchaProvider>
    );
  };

  return (props) => (
    <Recaptcha>
      <Component {...props} />
    </Recaptcha>
  );
};

export { withRecaptcha };
