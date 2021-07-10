import Cards from "react-credit-cards";
import { Flex } from "@livepeer.com/design-system";
import "react-credit-cards/es/styles-compiled.css";

const PaymentMethod = ({ data }) => {
  return (
    <Flex>
      {data && (
        <Cards
          issuer={data.card.brand}
          expiry={
            String(data.card.exp_month).padStart(2, "0") + data.card.exp_year
          }
          name={data.billing_details?.name}
          number={`************${data.card.last4}`}
          preview
          cvc=""
        />
      )}
    </Flex>
  );
};

export default PaymentMethod;
