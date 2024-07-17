import {
  TextField,
  Button,
  Grid,
  Box,
  Link as A,
  Text,
} from "@livepeer/design-system";
import { useEffect, useState } from "react";
import hash from "@livepeer.studio/api/dist/hash";
import { useRouter } from "next/navigation";
import { useHubspotForm } from "hooks";
import Link from "next/link";
import BroadcastingProvider from "./BroadcastingProvider";

// The frontend salts are all the same. This could be configurable someday.
export const FRONTEND_SALT = "69195A9476F08546";

const Login = ({ id, buttonText, onSubmit, loading, errors }) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    const [hashedPassword] = await hash(password, FRONTEND_SALT);
    // hash password, then
    return onSubmit({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      organization,
      phone,
    });
  };

  return (
    <Box
      css={{
        position: "relative",
        width: "100%",
      }}>
      <Box
        css={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          mb: "$3",
          maxWidth: 500,
          mx: "auto",
        }}>
        <form id={id} onSubmit={submit}>
          <TextField
            size="3"
            id="email"
            css={{
              width: "100%",
              mb: "$2",
            }}
            name="email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Box css={{ position: "relative", width: "100%" }}>
            <TextField
              size="3"
              id="password"
              css={{
                width: "100%",
                mx: 0,
              }}
              name="password"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Box
              css={{
                right: 20,
                position: "absolute",
                transform: "translateY(-50%)",
                top: "50%",
              }}>
              <Link href="/forgot-password" passHref legacyBehavior>
                <A
                  variant="primary"
                  css={{
                    display: "block",
                    textDecoration: "none",
                    fontSize: "$1",
                    fontWeight: 450,
                  }}>
                  Forgot
                </A>
              </Link>
            </Box>
          </Box>

          {errors.length > 0 && (
            <Box css={{ mt: "$2" }}>{errors.join(", ")}&nbsp;</Box>
          )}

          <Button
            variant="primary"
            disabled={loading ? true : false}
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

export default Login;
