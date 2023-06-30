import { TextField, Button, Box, Text } from "@livepeer/design-system";
import { useEffect, useState } from "react";
import hash from "@livepeer.studio/api/dist/hash";
import { useRouter } from "next/router";
import { useMailChimp } from "react-use-mailchimp-signup";
import { useHubspotForm } from "hooks";
import BroadcastingProvider from "../Login/BroadcastingProvider";

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

  const { subscribe } = useMailChimp({
    action: `https://livepeer.us16.list-manage.com/subscribe/post?u=57807e9b74db375864b2c4c68&id=ecd3bf60d5&f_id=00ae69e0f0&tags=3536469`,
  });

  useEffect(() => {
    if (router?.query?.email) {
      setEmail(router.query.email as string);
    }
  }, [router?.query?.email]);

  const submit = async (e) => {
    e.preventDefault();

    // Subscribe user to newsletter in Mailchimp
    subscribe({
      EMAIL: email,
      FNAME: firstName,
      LNAME: lastName,
    });

    // only handle submission to hubspot on prod
    if (process.env.NEXT_PUBLIC_SITE_URL === "livepeer.studio") {
      handleSubmit(e);
    }

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
        css={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          ml: "auto",
          mr: "auto",
          maxWidth: 500,
        }}>
        <form id={id} onSubmit={submit}>
          <Text
            variant="neutral"
            size={5}
            css={{
              maxWidth: 500,
              textAlign: "center",
              mx: "auto",
              mb: "$6",
            }}>
            Create an account.
          </Text>
          <BroadcastingProvider />
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
            disabled={loading ? true : false}
            size={4}
            css={{
              width: "100%",
              my: "$3",
              px: "$3",
            }}>
            {loading ? "Loading..." : buttonText}
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default Login;
