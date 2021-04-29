import useApi from "../../../hooks/use-api";
import { products } from "@livepeer.com/api/src/config";
import Layout from "../../../components/Layout";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "../../../components/TabbedLayout";
import Button from "components/Button";
import { getTabs } from "../user";
import { Container, Box, Flex, Heading } from "@theme-ui/components";
import { MdCreditCard } from "react-icons/md";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "../../../lib/utils";
import PricingCardsContainer from "components/Pricing/pricingCardsContainer";
import { useState } from "react";
import Modal from "components/Modal";
import ChangePaymentForm from "components/ChangePaymentForm";

const PlansPage = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  const [updatePaymentModal, setUpdatePaymentModal] = useState(false);

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  const tabs = getTabs(4);

  return (
    <Elements stripe={getStripe()}>
      <TabbedLayout tabs={tabs} logout={logout}>
        <Container sx={{mb: 6}}>
          {updatePaymentModal && (
            <Modal onClose={() => {}}>
              <Box>
                <ChangePaymentForm
                  onAbort={() => {
                    setUpdatePaymentModal(false);
                  }}
                  onSuccess={() => {
                    setUpdatePaymentModal(false);
                  }}
                />
              </Box>
            </Modal>
          )}
          <Box sx={{ width: "100%", pt: 5, borderColor: "muted" }}>
            <Container>
              <Box sx={{ width: "100%" }}>
                <Heading as="h2" sx={{ fontSize: 5, mb: 2 }}>
                  Plans
                </Heading>
                <Box sx={{ mb: 3, color: "offBlack" }}>
                  You are currently on the{" "}
                  <span
                    sx={{
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                      fontSize: 1,
                      borderRadius: 1000,
                      py: 0,
                      px: 2,
                      color: "black",
                      border: "1px solid",
                      borderColor: "muted",
                      bg: "rgba(0,0,0,.05)",
                    }}>
                    {user?.stripeProductId
                      ? products[user.stripeProductId].name
                      : products["prod_0"].name}
                  </span>{" "}
                  plan.
                </Box>
              </Box>
              {user?.stripeCustomerPaymentMethodId && (
                <Box
                  sx={{
                    px: 3,
                    py: "12px",
                    borderRadius: 6,
                    bg: "rgba(0,0,0,.02)",
                    border: "1px solid",
                    borderColor: "muted",
                  }}>
                  <Flex
                    sx={{
                      alignItems: "center",
                      width: "100%",
                      justifyContent: "space-between",
                    }}>
                    <Flex sx={{ color: "text", alignItems: "center", mr: 4 }}>
                      <MdCreditCard sx={{ mr: 2, fontSize: 4 }} />{" "}
                      <Box sx={{ fontSize: 1, mr: 2 }}>Credit Card: </Box>
                      <Box
                        sx={{
                          textTransform: "capitalize",
                          mr: 4,
                          fontSize: 1,
                        }}>
                        {user.ccBrand} •••• {user.ccLast4}
                      </Box>
                    </Flex>

                    <Button
                      variant="primarySmall"
                      onClick={() => {
                        setUpdatePaymentModal(true);
                      }}>
                      Change
                    </Button>
                  </Flex>
                </Box>
              )}
            </Container>
          </Box>
          <PricingCardsContainer inApp setModal={setUpdatePaymentModal} />
        </Container>
      </TabbedLayout>
    </Elements>
  );
};

export default PlansPage;
