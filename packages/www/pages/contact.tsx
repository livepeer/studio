/** @jsx jsx */
import { jsx } from "theme-ui";
import Fade from "react-reveal/Fade";
import Layout from "../layouts";
import { useRef, useState, useEffect } from "react";
import { Box, Flex, Container } from "@theme-ui/components";
import Textfield from "../components/Textfield";
import { useForm } from "react-hubspot";
import Button from "../components/Button";
import Link from "../components/Link";
import Prefooter from "../components/Prefooter";
import { useRouter } from "next/router";

const ContactPage = () => {
  const { query } = useRouter();
  console.log(query);
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
      url={`https://livepeer.com/contact`}
      withGradientBackground>
      <Container variant="hero">
        <Box sx={{ mb: 80 }}>
          <h1 sx={{ variant: "text.heading.hero" }}>Get in touch with us</h1>
          <Box sx={{ maxWidth: 728, variant: "text.heroDescription" }}>
            If you’d like to learn more about Livepeer.com’s innovative UGC
            focused video platform drop us a note and we’ll get right back to
            you!
            <br />
            <br />
            or email us at{" "}
            <Link href="mailto:hello@livepeer.com" isExternal>
              <b>hello@livepeer.com</b>
            </Link>
            .
          </Box>
        </Box>
        <form
          ref={formEl}
          onSubmit={handleSubmit}
          sx={{ textAlign: "center", maxWidth: 958, margin: "0 auto" }}>
          <Flex
            sx={{ flexDirection: ["column", "row"], mb: [3, 4], mx: [0, -3] }}>
            <Textfield
              htmlFor="firstname"
              id="firstname"
              sx={{ width: ["100%", "50%"], mb: [3, 0], mx: [0, 3] }}
              name="firstname"
              type="text"
              label="First Name"
            />
            <Textfield
              htmlFor="lastname"
              id="lastname"
              sx={{ width: ["100%", "50%"], mx: [0, 3] }}
              name="lastname"
              type="text"
              label="Last Name"
            />
          </Flex>
          <Flex
            sx={{ flexDirection: ["column", "row"], mb: [3, 4], mx: [0, -3] }}>
            <Textfield
              htmlFor="email"
              id="email"
              sx={{ width: ["100%", "50%"], mb: [3, 0], mx: [0, 3] }}
              name="email"
              type="email"
              label="Email*"
              required
            />
            <Textfield
              htmlFor="company"
              id="company"
              sx={{ width: ["100%", "50%"], mx: [0, 3] }}
              name="company"
              type="text"
              label="Organization"
            />
          </Flex>
          <input name="utm_source" type="hidden" value={query?.utm_source} />
          <input name="utm_medium" type="hidden" value={query?.utm_medium} />
          <input
            name="utm_campaign"
            type="hidden"
            value={query?.utm_campaign}
          />
          <Textfield
            htmlFor="message"
            id="message"
            sx={{ width: "100%" }}
            as="textarea"
            name="message"
            type="text"
            label="Message*"
            required
          />

          <Button sx={{ mt: 4, px: 5 }} variant="primary">
            Submit
          </Button>
          <Fade in={submitted}>
            <Box sx={{ mt: 3 }}>
              Thanks for reaching out! We'll get back to you shortly.
            </Box>
          </Fade>
        </form>
      </Container>
      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export default ContactPage;
