import { TextField, Button, Box, Text } from "@livepeer/design-system";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHubspotForm } from "hooks";

// The frontend salts are all the same. This could be configurable someday.
export const FRONTEND_SALT = "69195A9476F08546";

const ForgotPassword = ({ id, buttonText, onSubmit, loading, errors }) => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const { handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_LOGIN_FORM_ID,
  });

  useEffect(() => {
    if (router?.query?.email) {
      setEmail(router.query.email as string);
    }
  }, [router?.query?.email]);

  const submit = async (e) => {
    e.preventDefault();

    // only handle submission to hubspot on prod
    if (process.env.NEXT_PUBLIC_SITE_URL === "livepeer.studio") {
      handleSubmit(e);
    }

    return onSubmit({ email });
  };

  return (
    <Box
      css={{
        position: "relative",
        width: "100%",
      }}>
      <Text
        size="8"
        as="h1"
        css={{
          mb: "$7",
          fontWeight: 500,
          lineHeight: "30px",
          textAlign: "center",
        }}>
        Reset your password.
      </Text>

      <Box
        css={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          mb: "$3",
          ml: "auto",
          mr: "auto",
          maxWidth: 500,
        }}>
        <form id={id} onSubmit={submit}>
          <TextField
            size="3"
            id="email"
            css={{
              width: "100%",
              bc: "$neutral2",
              mb: "$2",
            }}
            name="email"
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {errors.length > 0 && (
            <Box css={{ mt: "$2" }}>{errors.join(", ")}&nbsp;</Box>
          )}

          <Button
            variant="transparentWhite"
            size={4}
            css={{
              bc: "#F8F8F8",
              color: "black",
              borderRadius: 10,
              fontWeight: 600,
              width: "100%",
              fontSize: 14,
              textDecoration: "none",
              textTransform: "uppercase",
              mt: "$3",
              "&:hover": {
                bc: "rgba(255, 255, 255, .8)",
                transition: ".2s",
                color: "black",
                textDecoration: "none",
              },
            }}>
            {loading ? "Loading..." : buttonText}
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
