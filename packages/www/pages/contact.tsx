import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Text,
  Grid,
  Container,
  TextField,
  TextArea,
  styled,
  RadioGroup,
  Select,
  Radio,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { useHubspotForm } from "hooks";
import Button from "@components/Marketing/Button";
import Prefooter from "@components/Marketing/Prefooter";
import { useRouter } from "next/router";
import Guides from "@components/Marketing/Guides";
import { Contact as Content } from "content";

const StyledCircleRadio = styled(Radio, {
  marginRight: "$1",
  span: {
    "&:after": {
      backgroundColor: "$slate11",
    },
  },
  "&:focus": {
    boxShadow: "inset 0 0 0 1px $colors$mauve8, 0 0 0 1px $colors$mauve8",
    color: "white",
  },
});

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
              Learn more about Livepeer Video Service's streaming API and media
              server. Leave us a message and we’ll get back to you.
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
                placeholder="First Name*"
                required
                css={{ py: "$4" }}
              />
              <TextField
                size="3"
                id="lastname"
                name="lastname"
                required
                type="text"
                placeholder="Last Name*"
              />
            </Grid>
            <TextField
              css={{ width: "100%", boxSizing: "border-box", mb: "$4" }}
              size="3"
              id="email"
              name="email"
              type="email"
              placeholder="Email*"
              required
            />
            <input name="utm_source" type="hidden" value={query?.utm_source} />
            <input name="utm_medium" type="hidden" value={query?.utm_medium} />
            <input
              name="utm_campaign"
              type="hidden"
              value={query?.utm_campaign}
            />
            <TextField
              css={{ width: "100%", boxSizing: "border-box", mb: "$4" }}
              size="3"
              id="subject"
              name="TICKET.subject"
              type="text"
              placeholder="Ticket subject*"
              required
            />
            <Grid
              css={{
                mb: "$2",
                gridTemplateColumns: "repeat(1,1fr)",
                "@bp2": {
                  gridTemplateColumns: "repeat(3,1fr)",
                },
              }}
              gap="5">
              <RadioGroup
                id="product"
                name="TICKET.product"
                css={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  mb: "$4",
                }}
                defaultValue="Streaming Services">
                <Box css={{ color: "$hiContrast", mb: "$2" }}>Product*</Box>
                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    mb: "$2",
                  }}>
                  <StyledCircleRadio value="Streaming Services" id="r1" />
                  <Box
                    as="label"
                    htmlFor="r1"
                    css={{ color: "$slate11", fontSize: "$2" }}>
                    Streaming Services
                  </Box>
                </Box>
                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    mb: "$2",
                  }}>
                  <StyledCircleRadio value="Catalyst" id="r2" />
                  <Box
                    as="label"
                    htmlFor="r2"
                    css={{ color: "$slate11", fontSize: "$2" }}>
                    Catalyst
                  </Box>
                </Box>

                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    mb: "$2",
                  }}>
                  <StyledCircleRadio value="MistServer" id="r3" />
                  <Box
                    as="label"
                    htmlFor="r3"
                    css={{ color: "$slate11", fontSize: "$2" }}>
                    MistServer
                  </Box>
                </Box>
              </RadioGroup>
              <Box css={{ textAlign: "left" }}>
                <Box css={{ color: "$hiContrast", mb: "$2" }}>User's Plan</Box>
                <Select
                  id="user_s_plan"
                  name="TICKET.user_s_plan"
                  defaultValue="Free"
                  required>
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Paid Plan 1">Paid Plan 1</option>
                  <option value="Paid Plan 2">Paid Plan 2</option>
                  <option value="Paid Plan 3">Paid Plan 3</option>
                  <option value="Paid Plan 4">Paid Plan 4</option>
                </Select>
              </Box>
              <Box css={{ display: "flex", justifyContent: "flex-start" }}>
                <RadioGroup
                  id="hs_ticket_category"
                  name="TICKET.hs_ticket_category"
                  css={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    mb: "$4",
                  }}
                  defaultValue="PRODUCT_ERROR">
                  <Box css={{ color: "$hiContrast", mb: "$2" }}>
                    Ticket category*
                  </Box>
                  <Box
                    css={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      mb: "$2",
                    }}>
                    <StyledCircleRadio
                      value="PRODUCT_ERROR"
                      id="PRODUCT_ERROR"
                    />
                    <Box
                      as="label"
                      htmlFor="PRODUCT_ERROR"
                      css={{ color: "$slate11", fontSize: "$2" }}>
                      Product error
                    </Box>
                  </Box>
                  <Box
                    css={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      mb: "$2",
                    }}>
                    <StyledCircleRadio
                      value="BILLING_ISSUE"
                      id="BILLING_ISSUE"
                    />
                    <Box
                      as="label"
                      htmlFor="BILLING_ISSUE"
                      css={{ color: "$slate11", fontSize: "$2" }}>
                      Billing issue
                    </Box>
                  </Box>
                  <Box
                    css={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      mb: "$2",
                    }}>
                    <StyledCircleRadio
                      value="MistServer"
                      id="FEATURE_REQUEST"
                    />
                    <Box
                      as="label"
                      htmlFor="FEATURE_REQUEST"
                      css={{ color: "$slate11", fontSize: "$2" }}>
                      Feature request
                    </Box>
                  </Box>
                  <Box
                    css={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      mb: "$2",
                    }}>
                    <StyledCircleRadio
                      value="GENERAL_INQUIRY"
                      id="GENERAL_INQUIRY"
                    />
                    <Box
                      as="label"
                      htmlFor="GENERAL_INQUIRY"
                      css={{ color: "$slate11", fontSize: "$2" }}>
                      General inquiry
                    </Box>
                  </Box>
                </RadioGroup>
              </Box>
            </Grid>

            <TextArea
              size="3"
              id="message"
              css={{ width: "100%", boxSizing: "border-box", mb: "$4" }}
              name="TICKET.content"
              placeholder="Tell us what's happening*"
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
