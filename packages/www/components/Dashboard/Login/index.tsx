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
import { useRouter } from "next/router";
import { useHubspotForm } from "hooks";
import Link from "next/link";

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
    handleSubmit(e);

    const [hashedPassword] = await hash(password, FRONTEND_SALT);
    // hash password, then
    onSubmit({
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
      <Text
        variant="neutral"
        size={5}
        css={{
          maxWidth: 460,
          textAlign: "center",
          mx: "auto",
          mb: "$7",
        }}>
        Your home for building onchain video experiences with Livepeer, the
        world's open video infrastructure.
      </Text>
      <Box
        as="form"
        onSubmit={submit}
        css={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          mb: "$3",
          ml: "auto",
          mr: "auto",
          maxWidth: 450,
        }}
        id={id}>
        <Text
          variant="neutral"
          size={1}
          css={{
            mb: "$1",
            fontSize: "11px",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
          Broadcasting provider
        </Text>
        <TextField
          readOnly
          size="3"
          id="email"
          css={{
            width: "100%",
            bc: "$neutral2",
          }}
          name="broadcastingProvider"
          type="text"
          required
          value="Livepeer Inc (default)"
        />
        <Text
          variant="neutral"
          css={{ fontSize: "11px", mx: "$1", mt: "$1", mb: "$5" }}>
          This is the organization that provides hosted access to the Livepeer
          network. Permissionless broadcasting is coming soon.
        </Text>
        <Text
          variant="neutral"
          size={1}
          css={{
            fontWeight: 600,
            mb: "$1",
            fontSize: "11px",
            textTransform: "uppercase",
          }}>
          Account
        </Text>

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
          size={4}
          css={{
            width: "100%",
            mt: "$3",
            px: "$3",
            fontSize: "$3",
          }}>
          {loading ? "Loading..." : buttonText}
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
