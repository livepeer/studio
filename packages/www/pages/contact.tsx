import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useDropzone } from "react-dropzone";
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
} from "@livepeer.com/design-system";
import { useHubspotForm } from "hooks";
import Button from "@components/Marketing/Button";
import Prefooter from "@components/Marketing/Prefooter";
import { useRouter } from "next/router";
import Guides from "@components/Marketing/Guides";
import { Contact as Content } from "content";

const activeStyle = {
  borderColor: "white",
};

const acceptStyle = {
  borderColor: "#5842c3",
};

const rejectStyle = {
  borderColor: "red",
};

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

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result;
        console.log(binaryStr);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: "image/jpeg,image/png",
    onDrop,
  });

  const style = useMemo(
    () => ({
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

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
                required>
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
                  <StyledCircleRadio value="Project Aqueduct" id="r2" />
                  <Box
                    as="label"
                    htmlFor="r2"
                    css={{ color: "$slate11", fontSize: "$2" }}>
                    Project Aqueduct
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
                <Select id="user_s_plan" name="TICKET.user_s_plan" required>
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
                  }}>
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
            />
            <Box
              css={{
                mb: "$6",
                width: "100%",
              }}>
              <Box
                css={{
                  width: "100%",
                  cursor: "pointer",
                  p: "$1",
                  mb: "$0",
                  height: "auto",
                  border: "1px solid $colors$mauve7",
                  borderRadius: "$1",
                }}
                {...getRootProps({ style })}>
                <Box
                  as="input"
                  {...getInputProps()}
                  // name="TICKET.hs_file_upload"
                />
                <Box
                  as="p"
                  css={{
                    width: "100%",
                    height: "100%",
                    border: "1px dotted $colors$mauve7",
                    borderRadius: "$1",
                    m: 0,
                    fontSize: "$2",
                    p: "$2",
                    transition: "border .24s ease-in-out",
                    minWidth: "296px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "$mauve9",
                  }}>
                  <b>
                    Provide any images that would assist in resolving the issue.
                  </b>
                  Drag and Drop your screenshots or logs or upload here
                </Box>
              </Box>
              {/* {acceptedFiles.map((file) => (
                <Box
                  as="p"
                  key={file?.path}
                  css={{
                    my: "$1",
                    width: "100%",
                    textAlign: "left",
                    fontSize: "$1",
                    overflowWrap: "break-word",
                    pl: "0",
                  }}>
                  {file?.path} - {file.size} bytes
                </Box>
              ))} */}
            </Box>

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
