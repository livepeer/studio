import Cards from "react-credit-cards";
import {
  Box,
  Heading,
  Badge,
  Flex,
  Link as A,
  styled,
  Skeleton,
  Button,
} from "@livepeer.com/design-system";
import { useApi } from "hooks";
import { useEffect, useState } from "react";
import "react-credit-cards/es/styles-compiled.css";

const Plans = () => {
  const { user, getPaymentMethod } = useApi();
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    const init = async () => {
      const [res, paymentMethod] = await getPaymentMethod(
        user.stripeCustomerPaymentMethodId
      );
      if (res.status == 200) {
        setPaymentMethod(paymentMethod);
      }
    };
    init();
  }, []);

  return (
    <Flex>
      {paymentMethod && (
        <Cards
          issuer={paymentMethod.card.brand}
          expiry={
            String(paymentMethod.card.exp_month).padStart(2, "0") +
            paymentMethod.card.exp_year
          }
          name={paymentMethod.billing_details?.name}
          number={`************${paymentMethod.card.last4}`}
          preview
          cvc=""
        />
      )}
    </Flex>
  );
};

export default Plans;
