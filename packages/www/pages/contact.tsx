import Fade from "react-reveal/Fade";
import Layout from "layouts/redesign";
import { useRef, useState, useEffect } from "react";
import {
  Box,
  Text,
  Grid,
  Container,
  TextField,
  TextArea,
  Heading,
  Link as A,
} from "@livepeer.com/design-system";
import { useForm } from "react-hubspot";
import Button from "components/Redesign/Button";
import Prefooter from "components/Redesign/Prefooter";
import { useRouter } from "next/router";
import Guides from "components/Redesign/Guides";

const ContactPage = () => {
  const { query } = useRouter();
  const formEl = useRef(null);
  const { data, handleSubmit } = useForm({
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
    <Layout
      title={`Contact - Livepeer.com`}
      description={`Scalable, secure live transcoding at a fraction of the cost`}
      url={`https://livepeer.com/contact`}>
      <Guides backgroundColor="$mauve2" />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$3",
            },
          }}>
          <Box css={{ mb: "$5", textAlign: "center" }}>
            <Heading as="h1" size="3" css={{ fontWeight: 600, mb: "$3" }}>
              Get in touch with us
            </Heading>
            <Text size="4" variant="gray" css={{ maxWidth: 630, mx: "auto" }}>
              If you’d like to learn more about Livepeer.com's innovative video
              developer platform drop us a note and we’ll get right back to you!
              <br />
              <br />
              or email us at{" "}
              <A href="mailto:hello@livepeer.com" target="_blank">
                hello@livepeer.com
              </A>
              .
            </Text>
          </Box>
          <Box
            as="form"
            ref={formEl}
            onSubmit={handleSubmit}
            css={{ maxWidth: 630, mx: "auto", textAlign: "center" }}>
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
                css={{ py: "$4" }}
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
            <input name="utm_source" type="hidden" value={query?.utm_source} />
            <input name="utm_medium" type="hidden" value={query?.utm_medium} />
            <input
              name="utm_campaign"
              type="hidden"
              value={query?.utm_campaign}
            />
            <TextArea
              size="3"
              id="message"
              css={{ width: "100%", boxSizing: "border-box" }}
              name="message"
              placeholder="Message*"
              required
            />
            <Box css={{ textAlign: "center" }}>
              <Button arrow css={{ mx: "auto", mt: "$4", px: "$4" }}>
                Submit
              </Button>

              <Fade in={submitted}>
                <Text variant="gray" css={{ mt: "$3" }}>
                  Thanks for reaching out! We'll get back to you shortly.
                </Text>
              </Fade>
            </Box>
          </Box>
        </Container>
      </Box>

      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export default ContactPage;
