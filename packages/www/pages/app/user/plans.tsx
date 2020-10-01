import Plans from "../../../components/Plans";
import useApi from "../../../hooks/use-api";
import Layout from "../../../components/Layout";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "../../../components/TabbedLayout";
import { getTabs } from "../user";
import { Container } from "@theme-ui/components";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "../../../lib/utils";

const PlansPage = () => {
  useLoggedIn();
  const { user, logout } = useApi();

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  const tabs = getTabs(3);

  return (
    <Elements stripe={getStripe()}>
      <TabbedLayout tabs={tabs} logout={logout}>
        <Container>
          <Plans
            dashboard={true}
            stripeProductId={
              user?.stripeProductId ? user.stripeProductId : "prod_0"
            }
          />
        </Container>
      </TabbedLayout>
    </Elements>
  );
};

export default PlansPage;
