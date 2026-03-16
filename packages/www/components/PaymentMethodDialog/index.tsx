import { useEffect, useState } from "react";
import {
  Flex,
  Box,
  Grid,
  Heading,
  TextField,
  Label,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  Alert,
} from "@livepeer/design-system";
import { Button } from "components/ui/button";
import Spinner from "components/Spinner";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useApi, useHubspotForm } from "hooks";
import { useForm } from "react-hook-form";
import { MdCreditCard } from "react-icons/md";
import { useTheme } from "next-themes";

const PaymentMethodDialog = ({ invalidateQuery }) => {
  const { user, updateCustomerPaymentMethod } = useApi();
  const [status, setStatus] = useState("initial");
  const [errorMessage, setErrorMessage] = useState("");
  const stripe = useStripe();
  const { register, handleSubmit } = useForm();
  const elements = useElements();
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { handleSubmit: hubspotSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_STRIPE_FORM_ID,
  });

  function createPaymentMethod({
    cardElement,
    stripeCustomerId,
    billingDetails,
  }) {
    return stripe
      .createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: billingDetails,
      })
      .then(async (result) => {
        const paymentMethod = result.paymentMethod;
        if (result.error) {
          setStatus("error");
          setErrorMessage(result.error.message);
        } else {
          updateCustomerPaymentMethod({
            stripeCustomerId,
            stripeCustomerPaymentMethodId: paymentMethod.id,
          })
            // If the card is declined, display an error to the user.
            .then((result: any) => {
              if (result.errors) {
                setErrorMessage(result.errors?.[0]?.split("\n")[0]);
                setStatus("error");
                // The card had an error when trying to attach it to a customer.
                throw result;
              }
              return result;
            })
            .then(onPaymentChangeComplete)
            .catch((error) => {
              console.log(error);

              setStatus("error");
            });
        }
      });
  }

  async function onPaymentChangeComplete() {
    setStatus("succeeded");
    await invalidateQuery();
    setOpen(false);
  }

  const onSubmit = async (data, e) => {
    e.preventDefault();
    hubspotSubmit(e);

    // Abort if form isn't valid
    if (!e.target.reportValidity()) return;

    setStatus("processing");

    const cardElement = elements!.getElement(CardElement);
    createPaymentMethod({
      cardElement,
      stripeCustomerId: user.stripeCustomerId,
      billingDetails: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: {
          line1: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
        },
      },
    });
  };

  useEffect(() => {
    setErrorMessage("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <Flex css={{ ai: "center" }}>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(true);
          }}>
          <MdCreditCard style={{ marginRight: "8px" }} />
          {!user.stripeCustomerPaymentMethodId
            ? "Add Payment Method"
            : "Change Payment Method"}
        </Button>
      </Flex>

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          id="billing-stripe-form">
          <AlertDialogTitle asChild>
            <Heading size="1">
              {!user.stripeCustomerPaymentMethodId
                ? "Add payment method"
                : "Change payment method"}
            </Heading>
          </AlertDialogTitle>

          {errorMessage && (
            <Alert
              css={{
                my: "$3",
                color: "$red11",
              }}
              variant={"red"}>
              {errorMessage}
            </Alert>
          )}

          <Box css={{ mt: "$2" }}>
            <Box css={{ color: "$hiContrast" }}>
              <Box>
                <Label css={{ mb: "$1", display: "block" }} htmlFor="name">
                  Full name
                </Label>
                <TextField
                  size="2"
                  ref={register({ required: true })}
                  placeholder="Jane Doe"
                  id="name"
                  name="name"
                  type="text"
                  css={{ width: "100%", mb: "$2" }}
                  required
                />
              </Box>
              <Grid
                gap={2}
                css={{
                  gridTemplateColumns: "1fr 1fr",
                  width: "100%",
                  alignItems: "center",
                  mb: "$2",
                }}>
                <Box>
                  <Label css={{ mb: "$1", display: "block" }} htmlFor="email">
                    Email
                  </Label>
                  <TextField
                    size="2"
                    ref={register({ required: true })}
                    placeholder="jane.doe@gmail.com"
                    id="email"
                    css={{ width: "100%" }}
                    name="email"
                    type="email"
                    required
                  />
                </Box>
                <Box>
                  <Label css={{ mb: "$1", display: "block" }} htmlFor="phone">
                    Phone
                  </Label>
                  <TextField
                    size="2"
                    ref={register({ required: true })}
                    placeholder="(941) 555-0123"
                    id="phone"
                    css={{ width: "100%" }}
                    name="phone"
                    type="text"
                    required
                  />
                </Box>
              </Grid>
              <Box>
                <Label css={{ mb: "$1", display: "block" }} htmlFor="address">
                  Address
                </Label>
                <TextField
                  size="2"
                  ref={register({ required: true })}
                  placeholder="185 Berry St"
                  id="address"
                  name="address"
                  type="text"
                  css={{ width: "100%", mb: "$2" }}
                  required
                />
              </Box>
              <Grid
                gap={2}
                css={{
                  gridTemplateColumns: "1fr 1fr 1fr",
                  width: "100%",
                  alignItems: "center",
                  mb: "$2",
                }}>
                <Box>
                  <Label css={{ mb: "$1", display: "block" }} htmlFor="city">
                    City
                  </Label>
                  <TextField
                    size="2"
                    ref={register({ required: true })}
                    placeholder="Brooklyn"
                    id="city"
                    css={{ width: "100%" }}
                    name="city"
                    type="text"
                    required
                  />
                </Box>
                <Box>
                  <Label css={{ mb: "$1", display: "block" }} htmlFor="State">
                    State
                  </Label>
                  <TextField
                    size="2"
                    ref={register({ required: true })}
                    placeholder="NY"
                    id="name"
                    css={{ width: "100%" }}
                    name="state"
                    type="text"
                    required
                  />
                </Box>
                <Box>
                  <Label
                    css={{ mb: "$1", display: "block" }}
                    htmlFor="postalCode">
                    ZIP
                  </Label>
                  <TextField
                    size="2"
                    ref={register({ required: true })}
                    placeholder="11211"
                    id="postalCode"
                    css={{ width: "100%" }}
                    name="postalCode"
                    type="text"
                    required
                  />
                </Box>
              </Grid>

              <Box
                css={{
                  fontSize: "$1",
                  color: "$hiContrast",
                  fontWeight: 500,
                  mb: "$1",
                }}>
                Card
              </Box>
              <Box
                css={{
                  border: "1px solid $colors$primary7",
                  borderRadius: 6,
                  background: "$loContrast",
                  px: "$2",
                }}>
                <CardElement
                  options={{
                    iconStyle: "solid",
                    style: {
                      base: {
                        backgroundColor:
                          resolvedTheme === "light" ? "white" : "#161618",
                        iconColor: "#3cb179",
                        color: resolvedTheme === "light" ? "#161618" : "white",
                        fontWeight: "500",
                        fontFamily:
                          "Inter, Roboto, Open Sans, Segoe UI, sans-serif",
                        fontSize: "14px",
                        lineHeight: "36px",
                        fontSmoothing: "antialiased",
                        "::placeholder": {
                          color: "#687176",
                        },
                        ":-webkit-autofill": {
                          color: "transparent",
                        },
                      },
                      invalid: {
                        iconColor: "red",
                        color: "red",
                      },
                    },
                  }}
                  onChange={(e) => {
                    if (e.error) {
                      setStatus("error");
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              className="elements-style-background"
              type="submit"
              disabled={
                !["initial", "succeeded", "error"].includes(status) || !stripe
              }>
              {status === "processing" && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Continue
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentMethodDialog;
