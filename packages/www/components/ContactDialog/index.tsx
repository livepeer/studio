import { useRef, useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Grid,
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
  TextField,
  TextArea,
  Button,
  useSnackbar,
} from "@livepeer/design-system";
import { useHubspotForm } from "hooks";
import { useRouter } from "next/navigation";

export const ContactDialog = ({ open, setOpen }) => {
  const router = useRouter();
  const { query } = router;
  const [openSnackbar] = useSnackbar();
  const formEl = useRef(null);
  const { data, handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_CONTACT_FORM_ID,
  });

  useEffect(() => {
    if (data) {
      formEl.current.reset();
      openSnackbar(
        "Thank you for getting in touch. Our team will get back to you soon."
      );
      setOpen(false);
    }
  }, [data]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <Text size={5} css={{ mb: "$3" }}>
          Get in touch
        </Text>
        <Flex align="center">
          <Box
            as="form"
            id="contact-form"
            ref={formEl}
            onSubmit={handleSubmit}
            css={{ maxWidth: 630, mx: "auto", textAlign: "center" }}>
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
              css={{ width: "100%", boxSizing: "border-box", mb: "$2" }}
              name="TICKET.content"
              placeholder="How can we help you?"
              required
            />
            <Box>
              <Flex align="center" css={{ jc: "flex-end", gap: "$3" }}>
                <AlertDialogCancel asChild>
                  <Button size={3} ghost>
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <Button size="3" variant="primary">
                  Submit
                </Button>
              </Flex>
            </Box>
          </Box>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ContactDialog;
