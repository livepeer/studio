import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import { useRef, useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Grid,
  Container,
  TextField,
  TextArea,
  Button,
} from "@livepeer/design-system";
import { useHubspotForm } from "hooks";
import { useRouter } from "next/router";
import { Contact as Content } from "content";

const ContactPage = () => {
  const router = useRouter();
  const { query } = router;
  const formEl = useRef(null);
  const { data, handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID,
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (data) {
      setSubmitted(true);
      formEl.current.reset();
      router.push("/contact?submitted=true");
      let timer = setTimeout(() => {
        setSubmitted(false);
      }, 4500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [data]);

  return (
    <Layout {...Content.metaData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            width: "100%",
            "@bp3": {
              px: "$4",
            },
          }}>
          <Flex
            align="center"
            css={{
              height: "100vh",
            }}>
            <Box
              as="form"
              id="contact-form"
              ref={formEl}
              onSubmit={handleSubmit}
              css={{ maxWidth: 630, mx: "auto", textAlign: "center" }}>
              <Box css={{ mb: "$5", textAlign: "center" }}>
                <Text
                  variant="neutral"
                  size={8}
                  css={{
                    maxWidth: 460,
                    textAlign: "center",
                    mx: "auto",
                    mb: "$7",
                  }}>
                  Speak with a Livepeer expert
                </Text>
              </Box>
              <Grid
                css={{
                  mb: "$2",
                  justifyContent: "center",
                  alignItems: "center",
                  gridTemplateColumns: "repeat(1,1fr)",
                  "@bp2": {
                    gridTemplateColumns: "repeat(2,1fr)",
                  },
                }}
                gap="2">
                <TextField
                  size="3"
                  id="firstname"
                  name="firstname"
                  type="text"
                  placeholder="First Name"
                  required
                  css={{ py: "$4" }}
                />
                <TextField
                  size="3"
                  id="lastname"
                  name="lastname"
                  required
                  type="text"
                  placeholder="Last Name"
                />
              </Grid>
              <TextField
                css={{ width: "100%", boxSizing: "border-box", mb: "$2" }}
                size="3"
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                required
              />
              <input
                name="utm_source"
                type="hidden"
                value={query?.utm_source}
              />
              <input
                name="utm_medium"
                type="hidden"
                value={query?.utm_medium}
              />
              <input
                name="utm_campaign"
                type="hidden"
                value={query?.utm_campaign}
              />

              <TextArea
                size="3"
                id="message"
                css={{ width: "100%", boxSizing: "border-box", mb: "$2" }}
                name="TICKET.content"
                placeholder="How can we help you?"
                required
              />
              <Box css={{ textAlign: "center" }}>
                <Button
                  size="4"
                  variant="primary"
                  css={{ width: "100%", mx: "auto", px: "$4" }}>
                  Submit
                </Button>
                <Fade in={submitted}>
                  <Text variant="neutral" css={{ mt: "$3" }}>
                    Thank you for getting in touch. Our team will get back to
                    you soon.
                  </Text>
                </Fade>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

ContactPage.theme = "light-theme-green";
export default ContactPage;
