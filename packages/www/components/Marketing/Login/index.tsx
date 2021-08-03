import { TextField, Grid, Box, Container } from "@livepeer.com/design-system";
import { useEffect, useState } from "react";
import hash from "@livepeer.com/api/dist/hash";
import { useRouter } from "next/router";
import Button from "@components/Marketing/Button";

// The frontend salts are all the same. This could be configurable someday.
export const FRONTEND_SALT = "69195A9476F08546";

const Login = ({
  id,
  showName = false,
  showOrganization = false,
  showPhone = false,
  showEmail,
  showPassword,
  buttonText,
  onSubmit,
  loading,
  errors,
}) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (router?.query?.email) {
      setEmail(router.query.email as string);
    }
  }, [router?.query?.email]);

  return (
    <Box
      css={{
        position: "relative",
        width: "100%",
      }}>
      <Box
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!showPassword) {
            return onSubmit({ email });
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
        }}
        css={{
          textAlign: "center",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: "$3",
          ml: "auto",
          mr: "auto",
          maxWidth: 500,
        }}
        id={id}>
        {showName && (
          <Grid
            gap={3}
            css={{
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              alignItems: "center",
            }}>
            <TextField
              size="3"
              id="firstName"
              css={{ width: "100%", mb: "$3" }}
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
              css={{ width: "100%", mb: "$3" }}
              name="lastName"
              type="text"
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Grid>
        )}
        {showOrganization && showPhone && (
          <Grid
            gap={3}
            css={{
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              alignItems: "center",
            }}>
            <TextField
              size="3"
              id="organization"
              css={{ width: "100%", mb: "$3" }}
              name="organization"
              type="organization"
              placeholder="Organization (optional)"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
            <TextField
              size="3"
              id="phone"
              css={{ width: "100%", mb: "$3" }}
              name="phone"
              type="phone"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Grid>
        )}
        {showEmail && (
          <TextField
            size="3"
            id="email"
            css={{
              width: "100%",
              mb: "$3",
              mx: "$2",
              "@bp1": {
                mx: "$4",
              },
            }}
            name="email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
        {showPassword && (
          <TextField
            size="3"
            id="password"
            css={{
              width: "100%",
              mx: "$2",
              "@bp1": {
                mx: "$4",
              },
            }}
            name="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <Box>{errors.join(", ")}&nbsp;</Box>

        <Button css={{ mt: "$2", px: "$5" }}>
          {loading ? "Loading..." : buttonText}
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
