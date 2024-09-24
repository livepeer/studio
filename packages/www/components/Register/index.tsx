import { TextField, Button, Box, Text } from "@livepeer/design-system";
import { useEffect, useState } from "react";
import hash from "@livepeer.studio/api/dist/hash";
import { useRouter } from "next/router";
import { useMailChimp } from "react-use-mailchimp-signup";
import { useHubspotForm } from "hooks";

// The frontend salts are all the same. This could be configurable someday.
export const FRONTEND_SALT = "69195A9476F08546";

const Register = ({ id, buttonText, onSubmit, loading, errors }) => {
  const router = useRouter();
  const [organization, setOrganization] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmSource, setUtmSource] = useState("");

  const { handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_REGISTER_FORM_ID,
  });

  const { subscribe } = useMailChimp({
    action: `https://livepeer.us16.list-manage.com/subscribe/post?u=57807e9b74db375864b2c4c68&id=ecd3bf60d5&f_id=00ae69e0f0&tags=3536469`,
  });

  useEffect(() => {
    if (router?.query?.email) {
      setEmail(router.query.email as string);
    }
  }, [router?.query?.email]);

  useEffect(() => {
    if (router?.query?.utm_campaign) {
      setUtmCampaign(router.query.utm_campaign as string);
    }
  }, [router?.query?.utm_campaign]);

  useEffect(() => {
    if (router?.query?.utm_content) {
      setUtmContent(router.query.utm_content as string);
    }
  }, [router?.query?.utm_content]);

  useEffect(() => {
    if (router?.query?.utm_medium) {
      setUtmMedium(router.query.utm_medium as string);
    }
  }, [router?.query?.utm_medium]);

  useEffect(() => {
    if (router?.query?.utm_source) {
      setUtmSource(router.query.utm_source as string);
    }
  }, [router?.query?.utm_source]);

  const submit = async (e) => {
    e.preventDefault();

    // Subscribe user to newsletter in Mailchimp
    subscribe({
      EMAIL: email,
    });

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
          maxWidth: 500,
          mx: "auto",
        }}>
        <form id={id} onSubmit={submit}>
          <Text
            size="8"
            as="h1"
            css={{
              mb: "$7",
              fontWeight: 500,
              lineHeight: "30px",
              textAlign: "center",
            }}>
            Create an account
          </Text>

          <TextField
            size="3"
            id="name"
            css={{
              width: "100%",
              mb: "$2",
            }}
            name="name"
            type="text"
            placeholder="Name"
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
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <TextField
            size="3"
            id="organization"
            css={{
              width: "100%",
              mb: "$2",
            }}
            name="organization"
            type="text"
            placeholder="Company name (optional)"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
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
            placeholder="myemail@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            size="3"
            id="password"
            css={{
              width: "100%",
              mb: "$2",
            }}
            name="password"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            id="utm_campaign"
            name="utm_campaign"
            type="hidden"
            value={utmCampaign}
          />

          <input
            id="utm_content"
            name="utm_content"
            type="hidden"
            value={utmContent}
          />

          <input
            id="utm_medium"
            name="utm_medium"
            type="hidden"
            value={utmMedium}
          />

          <input
            id="utm_source"
            name="utm_source"
            type="hidden"
            value={utmSource}
          />

          {errors.length > 0 && (
            <Box css={{ mt: "$2" }}>
              {errors
                .map((e) => {
                  // Make sure messages are capitalized
                  return e.charAt(0).toUpperCase() + e.slice(1);
                })
                .join(", ")}
              &nbsp;
            </Box>
          )}

          <Button
            variant="transparentWhite"
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
              my: "$3",
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

export default Register;
