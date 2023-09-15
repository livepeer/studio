import { useRef, useState, useEffect } from "react";
import {
  Box,
  Text,
  Grid,
  Container,
  TextField,
  Heading,
  TextArea,
  Link as A,
  Button,
} from "@livepeer/design-system";
import { useHubspotForm } from "hooks";
import Fade from "react-reveal/Fade";
import Guides from "../Guides";

const Contact = ({ backgroundColor }) => {
  const formEl = useRef(null);
  const { data, handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID,
  });

  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (data) {
      setSubmitted(true);
      formEl.current.reset();
      let timer = setTimeout(() => {
        setSubmitted(false);
      }, 4500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [data]);

  return (
    <Box css={{ position: "relative" }}>
      <Guides backgroundColor={backgroundColor} />
      <Container
        size="3"
        css={{ py: 88, px: 0, width: "100%", position: "relative" }}>
        <Box
          css={{
            px: "$6",
            "@bp2": {
              px: "$3",
            },
          }}>
          <Box css={{ mb: 48, textAlign: "center" }}>
            <Heading
              size="4"
              as="h2"
              css={{
                fontWeight: 700,
                color: "$hiContrast",
                fontSize: "$9",
                mb: "$5",
              }}>
              Get in touch
            </Heading>
          </Box>
          <Box
            as="form"
            ref={formEl}
            onSubmit={handleSubmit}
            css={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <Grid
              css={{
                mb: "$4",
                justifyContent: "center",
                alignItems: "center",
                gridTemplateColumns: "repeat(1,1fr)",
                "@bp2": {
                  gridTemplateColumns: "repeat(2,1fr)",
                },
              }}
              gap="5">
              <TextField
                size="3"
                id="firstname"
                name="firstname"
                type="text"
                placeholder="First Name"
              />
              <TextField
                size="3"
                id="lastname"
                name="lastname"
                type="text"
                placeholder="Last Name"
              />
            </Grid>
            <Grid
              css={{
                mb: "$4",
                justifyContent: "center",
                alignItems: "center",
                gridTemplateColumns: "repeat(1,1fr)",
                "@bp2": {
                  gridTemplateColumns: "repeat(2,1fr)",
                },
              }}
              gap="5">
              <TextField
                size="3"
                id="email"
                name="email"
                type="email"
                placeholder="Email*"
                required
              />
              <TextField
                size="3"
                id="company"
                name="company"
                type="text"
                placeholder="Organization"
              />
            </Grid>
            <TextArea
              size="3"
              id="message"
              css={{ width: "100%", boxSizing: "border-box" }}
              name="message"
              placeholder="Message*"
              required
            />
            <Box css={{ textAlign: "center" }}>
              <Button
                variant="green"
                size={4}
                css={{ mx: "auto", mt: "$4", px: "$4" }}>
                Submit
              </Button>

              <Fade in={submitted}>
                <Text variant="neutral" css={{ mt: "$3" }}>
                  Thank you for getting in touch. Our team will get back to you
                  soon.
                </Text>
              </Fade>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Contact;
