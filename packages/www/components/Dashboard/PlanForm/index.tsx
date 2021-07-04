import { useState } from "react";
import {
  Flex,
  Box,
  Grid,
  Heading,
  TextField,
  Label,
  Text,
  Button,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  useSnackbar,
} from "@livepeer.com/design-system";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useApi } from "hooks";
import { products } from "@livepeer.com/api/src/config";
import { useForm } from "react-hook-form";
import Spinner from "@components/Dashboard/Spinner";
import { useTheme } from "next-themes";

const PlanForm = ({ stripeProductId, text, variant, disabled, onClick }) => {
  const { user, updateSubscription } = useApi();
  const [status, setStatus] = useState("initial");
  const stripe = useStripe();
  const elements = useElements();
  const [open, setOpen] = useState(false);
  const [openSnackbar] = useSnackbar();
  const { register, handleSubmit } = useForm();
  const { theme } = useTheme();

  function createPaymentMethod({
    cardElement,
    stripeCustomerId,
    stripeCustomerSubscriptionId,
    stripeProductId,
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
          console.log(result.error);
          setStatus("error");
        } else {
          updateSubscription({
            stripeCustomerId,
            stripeCustomerPaymentMethodId: paymentMethod.id,
            stripeCustomerSubscriptionId,
            stripeProductId,
          })
            // If the card is declined, display an error to the user.
            .then((result: any) => {
              if (result.error) {
                setStatus("error");
                console.log(result.error);
                // The card had an error when trying to attach it to a customer.
                throw result;
              }
              return result;
            })
            // Normalize the result to contain the object returned by Stripe.
            // Add the additional details we need.
            .then((result) => {
              return {
                paymentMethodId: paymentMethod.id,
                subscription: result,
              };
            })
            // Some payment methods require a customer to be on session
            // to complete the payment process. Check the status of the
            // payment intent to handle these actions.
            .then(handlePaymentThatRequiresCustomerAction)
            // No more actions required. Provision your service for the user.
            .then(onSubscriptionComplete)
            .catch((error) => {
              console.log(error);
              setStatus("error");
              // An error has happened. Display the failure to the user here.
              // We utilize the HTML element we created.
              //showCardError(error);
            });
        }
      });
  }

  async function onSubscriptionComplete() {
    setStatus("succeeded");
    setOpen(false);
  }

  function handlePaymentThatRequiresCustomerAction({
    subscription,
    invoice,
    paymentMethodId,
  }) {
    let setupIntent = subscription.pending_setup_intent;

    if (setupIntent && setupIntent.status === "requires_action") {
      return stripe
        .confirmCardSetup(setupIntent.client_secret, {
          payment_method: paymentMethodId,
        })
        .then((result) => {
          if (result.error) {
            console.log(result.error);
            setStatus("error");
            // start code flow to handle updating the payment details
            // Display error message in your UI.
            // The card was declined (i.e. insufficient funds, card has expired, etc)
            throw result;
          } else {
            if (result.setupIntent.status === "succeeded") {
              // There's a risk of the customer closing the window before callback
              // execution. To handle this case, set up a webhook endpoint and
              // listen to setup_intent.succeeded.
              return {
                subscription: subscription,
                invoice: invoice,
                paymentMethodId: paymentMethodId,
              };
            }
          }
        });
    } else {
      // No customer action needed
      return { subscription, paymentMethodId };
    }
  }

  const onSubmit = async (data, e) => {
    e.preventDefault();

    // Abort if form isn't valid
    if (!e.target.reportValidity()) return;
    setStatus("processing");

    // If user already submitted payment, don't ask for payment information again
    if (user.stripeCustomerPaymentMethodId) {
      await updateSubscription({
        stripeCustomerId: user.stripeCustomerId,
        stripeCustomerPaymentMethodId: user.stripeCustomerPaymentMethodId,
        stripeCustomerSubscriptionId: user.stripeCustomerSubscriptionId,
        stripeProductId,
      });
      setStatus("succeeded");
      setOpen(false);
    } else {
      const cardElement = elements!.getElement(CardElement);
      createPaymentMethod({
        cardElement,
        stripeCustomerId: user.stripeCustomerId,
        stripeCustomerSubscriptionId: user.stripeCustomerSubscriptionId,
        stripeProductId,
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
    }
  };

  return (
    <>
      <AlertDialog open={open}>
        <Flex css={{ ai: "center" }}>
          <Button
            size="3"
            css={{ width: "100%" }}
            disabled={disabled}
            variant={variant}
            onClick={() => {
              onClick();
              setOpen(true);
            }}>
            {text}
          </Button>
        </Flex>

        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <AlertDialogTitle as={Heading} size="1">
              {!user.stripeCustomerPaymentMethodId
                ? "Enter card details"
                : "Change plan"}
            </AlertDialogTitle>

            <AlertDialogDescription css={{ mt: "$4", lineHeight: "22px" }}>
              {!user.stripeCustomerPaymentMethodId ? (
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
                      <Label
                        css={{ mb: "$1", display: "block" }}
                        htmlFor="email">
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
                      <Label
                        css={{ mb: "$1", display: "block" }}
                        htmlFor="phone">
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
                    <Label
                      css={{ mb: "$1", display: "block" }}
                      htmlFor="address">
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
                      <Label
                        css={{ mb: "$1", display: "block" }}
                        htmlFor="city">
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
                      <Label
                        css={{ mb: "$1", display: "block" }}
                        htmlFor="State">
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
                      border: "1px solid $colors$mauve7",
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
                              theme === "light" ? "white" : "#161618",
                            iconColor: "#5746af",
                            color: theme === "light" ? "#161618" : "white",
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
              ) : (
                <Text variant="gray">
                  You are currently using the{" "}
                  {products[user.stripeProductId].name} plan. Do you want to{" "}
                  {products[stripeProductId].order <
                  products[user.stripeProductId].order
                    ? "downgrade"
                    : "upgrade"}{" "}
                  to the {products[stripeProductId].name} plan?
                </Text>
              )}
            </AlertDialogDescription>

            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
              <AlertDialogCancel
                size="2"
                onClick={() => {
                  setOpen(false);
                }}
                as={Button}
                ghost>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                as={Button}
                size="2"
                className="elements-style-background"
                type="submit"
                disabled={
                  !["initial", "succeeded", "error"].includes(status) || !stripe
                }
                variant="violet">
                {status === "processing" && (
                  <Spinner
                    css={{
                      width: 16,
                      height: 16,
                      mr: "$2",
                    }}
                  />
                )}
                Continue
              </AlertDialogAction>
            </Flex>
          </Box>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PlanForm;
