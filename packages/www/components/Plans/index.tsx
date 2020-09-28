import { Container, Box, Flex, Heading } from "@theme-ui/components";
import { useState } from "react";
import { MdCheck } from "react-icons/md";
import Button from "../Button";
import Modal from "../Modal";
import PlanForm from "../PlanForm";
import { products } from "@livepeer.com/api/src/config";
import useApi from "../../hooks/use-api";
import { MdCreditCard } from "react-icons/md";
import ChangePaymentForm from "../ChangePaymentForm";
import { useRouter } from "next/router";

const Item = ({ title, displayCheck = true, color = "black" }) => (
  <Flex
    sx={{
      fontSize: 1,
      height: 50,
      alignItems: "center",
      borderBottom: "1px solid",
      borderColor: "rgba(255, 255, 255, .3)"
    }}
  >
    {displayCheck && <MdCheck sx={{ mr: 2, color: color }} />}
    {title}
  </Flex>
);

const List = ({ children, ...props }) => (
  <Box sx={{ pb: 3 }} {...props}>
    {children}
  </Box>
);

const Header = ({ title, subtitle, cta, ...props }) => (
  <Flex
    sx={{
      mb: 3,
      flexDirection: "column",
      justifyContent: "space-between",
      height: 116
    }}
    {...props}
  >
    <Heading as="h3" sx={{ mb: 2, fontSize: 4, fontWeight: 700 }}>
      {title}
    </Heading>
    <Box sx={{ mb: 3, fontSize: 1 }}>{subtitle}</Box>
    <Button
      disabled={cta.disabled}
      variant={cta.variant}
      sx={{ width: "100%" }}
    >
      {cta.text}
    </Button>
  </Flex>
);

type PlanProps = {
  dashboard?: boolean;
  stripeProductId?: string;
};

const Plans = ({ dashboard = false, stripeProductId }: PlanProps) => {
  const router = useRouter();
  const { user } = useApi();
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [updatePaymentModal, setUpdatePaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("prod_0");

  return (
    <>
      {subscriptionModalOpen && (
        <Modal onClose={() => {}}>
          <Box>
            <PlanForm
              onAbort={() => {
                setSubscriptionModalOpen(false);
              }}
              onSuccess={() => {
                setSubscriptionModalOpen(false);
              }}
              stripeProductId={selectedProduct}
            />
          </Box>
        </Modal>
      )}
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
      {dashboard && (
        <Box sx={{ width: "100%", pt: 5, pb: 4, borderColor: "muted" }}>
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
                    bg: "rgba(0,0,0,.05)"
                  }}
                >
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
                  bg: "rgba(0,0,0,.03)",
                  border: "1px solid",
                  borderColor: "muted"
                }}
              >
                <Flex
                  sx={{
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "space-between"
                  }}
                >
                  <Flex sx={{ color: "offBlack", alignItems: "center", mr: 4 }}>
                    <MdCreditCard sx={{ mr: 2, fontSize: 4 }} />{" "}
                    <Box sx={{ fontSize: 1, mr: 2 }}>Credit Card: </Box>
                    <Box
                      sx={{ textTransform: "capitalize", mr: 4, fontSize: 1 }}
                    >
                      {user.ccBrand} •••• {user.ccLast4}
                    </Box>
                  </Flex>

                  <Button
                    variant="primarySmall"
                    onClick={() => {
                      setUpdatePaymentModal(true);
                    }}
                  >
                    Change
                  </Button>
                </Flex>
              </Box>
            )}
          </Container>
        </Box>
      )}
      <Box
        sx={{
          borderRadius: 16,
          position: "relative",
          py: 5,
          px: 4,
          mb: 100
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Box sx={{ pl: 4, width: "25%", maxWidth: 174 }}>
            <Flex
              sx={{
                mb: 3,
                flexDirection: "column",
                justifyContent: "flex-end",
                height: 116,
                fontWeight: 500
              }}
            >
              Usage
            </Flex>
            <List>
              <Item displayCheck={false} title="Transcoding" />
              <Item displayCheck={false} title="Storage" />
              <Item displayCheck={false} title="Streaming" />
            </List>
          </Box>
          <Box
            sx={{
              background:
                "linear-gradient(180deg, #FAFAFA 0%, rgba(255, 255, 255, 0) 100%)",
              p: 4,
              borderRadius: 16,
              width: "25%"
            }}
          >
            <Header
              title={products["prod_0"].name}
              subtitle="Free"
              cta={{
                text: dashboard
                  ? stripeProductId === "prod_0"
                    ? "Current plan"
                    : "Downgrade"
                  : "Sign up",
                disabled:
                  dashboard && stripeProductId === "prod_0" ? true : false,
                variant: "tertiarySmall"
              }}
              onClick={() => {
                if (dashboard) {
                  setSelectedProduct("prod_0");
                  setSubscriptionModalOpen(true);
                } else {
                  router.push("/register");
                }
              }}
            />
            <List>
              <Item title="Up to 120 minutes / month" />
              <Item title="" displayCheck={false} />
              <Item title="" displayCheck={false} />
            </List>
          </Box>
          <Box
            sx={{
              width: "25%",
              bg: "primary",
              color: "white",
              boxShadow: "0px 4px 34px rgba(0, 0, 0, 0.08)",
              borderRadius: "16px",
              p: 4
            }}
          >
            <Header
              title={products["prod_1"].name}
              subtitle="Pay as you go"
              cta={{
                text: dashboard
                  ? stripeProductId === "prod_1"
                    ? "Current plan"
                    : stripeProductId === "prod_2"
                    ? "Downgrade"
                    : "Upgrade"
                  : "Sign up",
                disabled:
                  dashboard && stripeProductId === "prod_1" ? true : false,
                variant: "secondarySmall"
              }}
              onClick={() => {
                if (dashboard) {
                  setSelectedProduct("prod_1");
                  setSubscriptionModalOpen(true);
                } else {
                  router.push("/register");
                }
              }}
            />

            <List>
              <Item title="$0.01 / min video ingested" color="pink" />
              <Item title="$0.002 / gb video stored" color="pink" />
              <Item title="$0.003 / gb video streamed" color="pink" />
            </List>
          </Box>
          <Box
            sx={{
              background:
                "linear-gradient(180deg, #FAFAFA 0%, rgba(255, 255, 255, 0) 100%)",
              borderRadius: 16,
              p: 4,
              width: "25%"
            }}
          >
            <Header
              title={products["prod_2"].name}
              subtitle="Custom pricing"
              cta={{
                text: dashboard
                  ? stripeProductId === "prod_2"
                    ? "Current plan"
                    : "Contact sales"
                  : "Contact sales",
                disabled:
                  dashboard && stripeProductId === "prod_2" ? true : false,
                variant: "primarySmall"
              }}
              onClick={() => {
                router.push("/contact");
              }}
            />

            <List>
              <Item title="Custom pricing" color="purple" />
              <Item title="Custom pricing" color="purple" />
              <Item title="Custom pricing" color="purple" />
            </List>
          </Box>
        </Flex>
      </Box>
    </>
  );
};

export default Plans;
