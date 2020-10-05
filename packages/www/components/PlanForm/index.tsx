import { useState } from "react";
import { Flex, Box, Grid, Heading } from "@theme-ui/components";
import Button from "../Button";
import Textfield from "../Textfield";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useApi } from "../../hooks";
import { products } from "@livepeer.com/api/src/config";
import { CARD_OPTIONS } from "../../lib/utils";
import { useForm } from "react-hook-form";

const PlanForm = ({ stripeProductId, onAbort, onSuccess }) => {
  const { user, updateSubscription } = useApi();
  const [status, setStatus] = useState("initial");
  const stripe = useStripe();
  const elements = useElements();

  const { register, handleSubmit } = useForm();

  function createPaymentMethod({
    cardElement,
    stripeCustomerId,
    stripeCustomerSubscriptionId,
    stripeProductId,
    billingDetails
  }) {
    return stripe
      .createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: billingDetails
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
            stripeProductId
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
                subscription: result
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
    onSuccess();
  }

  function handlePaymentThatRequiresCustomerAction({
    subscription,
    invoice,
    paymentMethodId
  }) {
    let setupIntent = subscription.pending_setup_intent;

    if (setupIntent && setupIntent.status === "requires_action") {
      return stripe
        .confirmCardSetup(setupIntent.client_secret, {
          payment_method: paymentMethodId
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
                paymentMethodId: paymentMethodId
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
        stripeProductId
      });
      setStatus("succeeded");
      onSuccess();
    } else {
      const cardElement = elements!.getElement(CardElement);
      createPaymentMethod({
        cardElement,
        stripeCustomerId: user.stripeCustomerId,
        stripeCustomerSubscriptionId: user.stripeCustomerSubscriptionId,
        stripeProductId,
        billingDetails: {
          name: data.name,
          address: {
            line1: data.address,
            city: data.city,
            state: data.state,
            postal_code: data.postalCode
          }
        }
      });
    }
  };

  return (
    <>
      <Heading as="h4" sx={{ mb: 3 }}>
        {!user.stripeCustomerPaymentMethodId
          ? "Enter card details"
          : "Change plan"}
      </Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        {!user.stripeCustomerPaymentMethodId ? (
          <fieldset>
            <Textfield
              inputRef={register({ required: true })}
              htmlFor="name"
              variant="standard"
              fixedLabel
              placeholder="Jane Doe"
              id="name"
              name="name"
              type="text"
              sx={{ width: "100%", mb: 3 }}
              label="Name"
              required
            />
            <Textfield
              inputRef={register({ required: true })}
              htmlFor="address"
              variant="standard"
              fixedLabel
              placeholder="185 Berry St"
              id="address"
              name="address"
              type="text"
              sx={{ width: "100%", mb: 3 }}
              label="Address"
              required
            />
            <Grid
              gap={2}
              sx={{
                gridTemplateColumns: "1fr 1fr 1fr",
                width: "100%",
                alignItems: "center",
                mb: 3
              }}
            >
              <Textfield
                inputRef={register({ required: true })}
                htmlFor="city"
                variant="standard"
                fixedLabel
                placeholder="Brooklyn"
                id="city"
                sx={{ width: ["100%"] }}
                name="city"
                type="text"
                label="City"
                required
              />
              <Textfield
                inputRef={register({ required: true })}
                htmlFor="state"
                variant="standard"
                fixedLabel
                placeholder="NY"
                id="lastName"
                sx={{ width: ["100%"] }}
                name="state"
                type="text"
                label="State"
                required
              />
              <Textfield
                inputRef={register({ required: true })}
                htmlFor="postalCode"
                variant="standard"
                fixedLabel
                placeholder="11211"
                id="postalCode"
                sx={{ width: ["100%"] }}
                name="postalCode"
                type="text"
                label="ZIP"
                required
              />
            </Grid>
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: "ultraLightGray",
                transition: "border-color .2s",
                borderRadius: 0,
                pb: "5px",
                mb: 3,
                "&:hover": {
                  borderColor: "primary"
                },
                "&:focus": {
                  outline: "none",
                  borderColor: "primary"
                }
              }}
            >
              <Box
                sx={{
                  fontSize: 0,
                  color: "offBlack",
                  fontWeight: 600,
                  mb: 1
                }}
              >
                Card
              </Box>
              <CardElement
                options={CARD_OPTIONS}
                onChange={(e) => {
                  if (e.error) {
                    setStatus("error");
                  }
                }}
              />
            </Box>
          </fieldset>
        ) : (
          <Box>
            You are currently using the {products[user.stripeProductId].name}{" "}
            plan. Do you want to{" "}
            {products[stripeProductId].order <
            products[user.stripeProductId].order
              ? "downgrade"
              : "upgrade"}{" "}
            to the {products[stripeProductId].name} plan?
          </Box>
        )}
        <Flex sx={{ mt: 3, alignItems: "center", justifyContent: "flex-end" }}>
          <Button
            onClick={() => {
              onAbort();
            }}
            variant="outlineSmall"
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            className="elements-style-background"
            type="submit"
            disabled={
              !["initial", "succeeded", "error"].includes(status) || !stripe
            }
            variant="primarySmall"
          >
            Continue
          </Button>
        </Flex>
      </form>
    </>
  );
};

export default PlanForm;
