import {
  ChangeEventHandler,
  FormEventHandler,
  useEffect,
  useState
} from "react";
import { Flex, Box, Heading } from "@theme-ui/components";
import Button from "../Button";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useApi } from "../../hooks";
import { products } from "@livepeer.com/api/src/config";
import { CARD_OPTIONS } from "../../lib/utils";

const ChangePaymentForm = ({ onAbort, onSuccess }) => {
  const { user, updateCustomerPaymentMethod } = useApi();
  const [status, setStatus] = useState("initial");
  const stripe = useStripe();
  const elements = useElements();

  function createPaymentMethod({ cardElement, stripeCustomerId }) {
    return stripe
      .createPaymentMethod({
        type: "card",
        card: cardElement
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
            // Normalize the result to contain the object returned by Stripe.
            // Add the additional details we need.
            .then((result) => {
              return {
                paymentMethodId: paymentMethod.id,
                setupIntent: result.subscriptions.data[0].pending_setup_intent
              };
            })
            // Some payment methods require a customer to be on session
            // to complete the payment process. Check the status of the
            // payment intent to handle these actions.
            .then(handlePaymentThatRequiresCustomerAction)
            // No more actions required. Provision your service for the user.
            .then(onPaymentChangeComplete)
            .catch((error) => {
              setStatus("error");
            });
        }
      });
  }

  async function onPaymentChangeComplete() {
    setStatus("succeeded");
    onSuccess();
  }

  function handlePaymentThatRequiresCustomerAction({
    setupIntent,
    paymentMethodId
  }) {
    if (setupIntent && setupIntent.status === "requires_action") {
      return stripe
        .confirmCardSetup(setupIntent.client_secret, {
          payment_method: paymentMethodId
        })
        .then((result) => {
          if (result.error) {
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
                paymentMethodId
              };
            }
          }
        });
    } else {
      // No customer action needed
      return { paymentMethodId };
    }
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // Abort if form isn't valid
    if (!e.currentTarget.reportValidity()) return;

    setStatus("processing");

    const cardElement = elements!.getElement(CardElement);
    createPaymentMethod({
      cardElement,
      stripeCustomerId: user.stripeCustomerId
    });
  };

  return (
    <>
      <Heading as="h4" sx={{ mb: 3 }}>
        Change Payment Details
      </Heading>
      <form onSubmit={handleSubmit}>
        <fieldset className="elements-style">
          <Box
            sx={{
              borderRadius: 8,
              padding: 16,
              backgroundColor: "rgba(237, 242, 247, .6)"
            }}
          >
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
