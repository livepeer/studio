/** @jsx jsx */
import { jsx } from "theme-ui";
import Textfield from "../../components/Textfield";
import { Button, Grid, Box, Container } from "@theme-ui/components";
import { useEffect, useState } from "react";
import hash from "../../lib/utils/hash"
import { useRouter } from "next/router";

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
    <Container>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!showPassword) {
            return onSubmit({ email });
          }
          const hashedPassword = await hash(password, FRONTEND_SALT);
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
        sx={{
          textAlign: "center",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 3,
          maxWidth: 600,
          ml: "auto",
          mr: "auto",
        }}
        id={id}>
        {showName && (
          <Grid
            sx={{
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              alignItems: "center",
            }}>
            <Textfield
              htmlFor="firstName"
              id="firstName"
              sx={{ width: ["100%"], mb: [3, 3] }}
              name="firstName"
              type="text"
              label="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Textfield
              htmlFor="lastName"
              id="lastName"
              sx={{ width: ["100%"], mb: [3, 3] }}
              name="lastName"
              type="text"
              label="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Grid>
        )}
        {showOrganization && showPhone && (
          <Grid
            sx={{
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              alignItems: "center",
            }}>
            <Textfield
              htmlFor="organization"
              id="organization"
              sx={{ width: ["100%"], mb: [3, 3] }}
              name="organization"
              type="organization"
              label="Organization (optional)"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
            <Textfield
              htmlFor="phone"
              id="phone"
              sx={{ width: ["100%"], mb: [3, 3] }}
              name="phone"
              type="phone"
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Grid>
        )}
        {showEmail && (
          <Textfield
            htmlFor="email"
            id="email"
            sx={{ width: ["100%"], mb: [3, 3], mx: [1, 3] }}
            name="email"
            type="email"
            label="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
        {showPassword && (
          <Textfield
            htmlFor="password"
            id="password"
            sx={{ width: ["100%"], mb: [3, 3], mx: [1, 3] }}
            name="password"
            type="password"
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <Box>{errors.join(", ")}&nbsp;</Box>

        <Button sx={{ mt: 3, px: 5 }} variant="primary">
          {loading ? "Loading..." : buttonText}
        </Button>
      </form>
    </Container>
  );
};

export default Login;
