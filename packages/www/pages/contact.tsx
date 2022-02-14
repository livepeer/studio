import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
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
import { useHubspotForm } from "hooks";
import Button from "@components/Marketing/Button";
import Prefooter from "@components/Marketing/Prefooter";
import { useRouter } from "next/router";
import Guides from "@components/Marketing/Guides";
import { Contact as Content } from "content";

const ContactPage = () => {
  const router = useRouter();
  const { query } = router;
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
              px: "$4",
            },
          }}>
          <Box css={{ mb: "$5", textAlign: "center" }}>
            <Heading as="h1" size="3" css={{ fontWeight: 600, mb: "$3" }}>
              Get in touch
            </Heading>
            <Text size="4" variant="gray" css={{ maxWidth: 630, mx: "auto" }}>
              Learn more about Livepeer Video Service's innovative streaming API
              and media server. Leave us a message and we’ll get back to you.
              <br />
              <br />
              Or email us at{" "}
              <A
                href="mailto:hello@livepeer.com?subject=Livepeer%20Video%20Services%20inquiry"
                target="_blank">
                hello@livepeer.com
              </A>
              .
            </Text>
          </Box>
          <Box
            as="form"
            id="contact-form"
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
                  Thank you for getting in touch. Our team will get back to you
                  soon.
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
