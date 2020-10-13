import { useState } from "react";
import { Flex, Box, Grid, Heading } from "@theme-ui/components";
import Button from "../Button";
import Textfield from "../Textfield";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useApi } from "../../hooks";
import { CARD_OPTIONS } from "../../lib/utils";
import { useForm } from "react-hook-form";

const ChangePaymentForm = ({ onAbort, onSuccess }) => {
  const { user, updateCustomerPaymentMethod } = useApi();
  const [status, setStatus] = useState("initial");
  const stripe = useStripe();
  const { register, handleSubmit } = useForm();
  const elements = useElements();

  function createPaymentMethod({
    cardElement,
    stripeCustomerId,
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
          setStatus("error");
        } else {
          updateCustomerPaymentMethod({
            stripeCustomerId,
            stripeCustomerPaymentMethodId: paymentMethod.id
          })
            // If the card is declined, display an error to the user.
            .then((result: any) => {
              if (result.error) {
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
    onSuccess();
  }

  const onSubmit = async (data, e) => {
    e.preventDefault();

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
          postal_code: data.postalCode
        }
      }
    });
  };

  return (
    <>
      <Heading as="h4" sx={{ mb: 3 }}>
        Change Payment Details
      </Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
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
          <Grid
            gap={2}
            sx={{
              gridTemplateColumns: "1fr 1fr",
              width: "100%",
              alignItems: "center",
              mb: 3
            }}
          >
            <Textfield
              inputRef={register({ required: true })}
              htmlFor="email"
              variant="standard"
              fixedLabel
              placeholder="jane.doe@gmail.com"
              id="email"
              sx={{ width: ["100%"] }}
              name="email"
              type="email"
              label="Email"
              required
            />
            <Textfield
              inputRef={register({ required: true })}
              htmlFor="phone"
              variant="standard"
              fixedLabel
              placeholder="(941) 555-0123"
              id="phone"
              sx={{ width: ["100%"] }}
              name="phone"
              type="tel"
              label="Phone"
              required
            />
          </Grid>
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
                fontWeight: 500,
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

export default ChangePaymentForm;
