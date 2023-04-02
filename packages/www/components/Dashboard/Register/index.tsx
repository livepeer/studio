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
          size={5}
          css={{
            maxWidth: 450,
            textAlign: "center",
            mx: "auto",
            mb: "$6",
          }}>
          Create an account
        </Text>
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
          name="email"
          type="email"
          placeholder="Email"
          required
          value="Livepeer Inc (default)"
        />
        <Text variant="neutral" size={1} css={{ mx: "$1", mt: "$1", mb: "$5" }}>
          This is the organization that provides hosted access to the Livepeer
          network. 100% permissionless broadcasting is coming soon.
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
          Account details
        </Text>
        <TextField
          size="3"
          id="firstName"
          css={{
            width: "100%",
            // bc: "$neutral2",
            mb: "$2",
          }}
          name="firstName"
          type="text"
          placeholder="First name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
          size="3"
          id="lastName"
          css={{
            width: "100%",
            // bc: "$neutral2",
            mb: "$2",
          }}
          name="lastName"
          type="text"
          placeholder="Last name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextField
          size="3"
          id="email"
          css={{
            width: "100%",
            // bc: "$neutral2",
            mb: "$2",
          }}
          name="email"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          size="3"
          id="password"
          css={{
            width: "100%",
            // bc: "$neutral2",
            mx: 0,
          }}
          name="password"
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errors.length > 0 && (
          <Box css={{ mt: "$2" }}>{errors.join(", ")}&nbsp;</Box>
        )}

        <Button
          variant="primary"
          size={4}
          css={{
            width: "100%",
            my: "$3",
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
