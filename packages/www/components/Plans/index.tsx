/** @jsx jsx */
import { jsx } from "theme-ui";
import { Container, Box, Flex, Heading } from "@theme-ui/components";
import { MdCheck, MdClose } from "react-icons/md";
import Button from "../Button";
import Modal from "../Modal";
import PlanForm from "../PlanForm";
import { products } from "@livepeer.com/api/src/config";
import useApi from "../../hooks/use-api";
import { MdCreditCard } from "react-icons/md";
import ChangePaymentForm from "../ChangePaymentForm";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Tour: any = dynamic(() => import("reactour"), { ssr: false });
const steps = [
  {
    selector: ".upgrade-card",
    content: `Welcome to Livepeer.com! You're currently subscribed to the free plan. Click "Upgrade" to enter your credit card information and switch over to the pay-as-you-go plan for unlimited transcoding minutes.`,
  },
  // ...
];

const Item = ({
  title,
  displayCheck = true,
  displayX = false,
  color = "black",
  styles = null,
}) => (
  <Flex
    sx={{
      fontSize: 1,
      height: 50,
      alignItems: "center",
      borderBottom: "1px solid",
      letterSpacing: -0.3,
      borderColor: "rgba(0, 0, 0, .1)",
      ...styles,
    }}>
    {displayCheck && <MdCheck sx={{ mr: 2, color: color }} />}
    {displayX && <MdClose sx={{ mr: 2, color: color }} />}
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
      height: 116,
    }}
    {...props}>
    <Heading as="h3" sx={{ mb: 2, fontSize: 4, fontWeight: 700 }}>
      {title}
    </Heading>
    <Box sx={{ mb: 3, fontSize: 1 }}>{subtitle}</Box>
    <Button
      disabled={cta.disabled}
      variant={cta.variant}
      sx={{ width: "100%" }}>
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
  const [isTourOpen, setIsTourOpen] = useState(false);
  const promptUpgrade = router.query?.promptUpgrade;

  useEffect(() => {
    if (promptUpgrade) {
      setIsTourOpen(true);
    }
  }, [promptUpgrade]);

  return (
    <>
      <Tour
        steps={steps}
        disableDotsNavigation={false}
        showButtons={false}
        rounded={6}
        showNumber={false}
        showNavigation={false}
        isOpen={isTourOpen}
        onAfterOpen={() => (document.body.style.overflowY = "hidden")}
        onBeforeClose={() => {
          document.body.style.overflowY = "auto";
          if (location.href.includes("?")) {
            history.pushState({}, null, location.href.split("?")[0]);
          }
        }}
        onRequestClose={() => setIsTourOpen(false)}
      />
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
                <Box
                  as="span"
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
                </Box>{" "}
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
                      sx={{ textTransform: "capitalize", mr: 4, fontSize: 1 }}>
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
      )}
      <Box
        sx={{
          borderRadius: 16,
          position: "relative",
          py: 5,
          mb: 100,
        }}>
        <Flex
          sx={{
            flexDirection: ["column", "column", "column", "row"],
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box
            sx={{
              pl: 4,
              width: ["100%", "100%", "100%", "25%"],
              maxWidth: 174,
              "@media screen and (max-width: 1200px)": {
                display: "none",
              },
            }}>
            <Flex
              sx={{
                mb: 3,
                flexDirection: "column",
                justifyContent: "flex-end",
                height: 116,
                fontWeight: 500,
              }}>
              Usage
            </Flex>
            <List>
              <Item displayCheck={false} title="Transcoding" />
              <Item displayCheck={false} title="Recording storage" />
              <Item displayCheck={false} title="Streaming*" />
            </List>
          </Box>
          <Box
            sx={{
              background:
                "linear-gradient(180deg, #FAFAFA 0%, rgba(255, 255, 255, 0) 100%)",
              p: 4,
              borderRadius: 16,
              width: ["100%", "100%", "100%", "25%"],
              minWidth: 300,
            }}>
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
                variant: "tertiarySmall",
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
              <Item
                styles={{
                  borderColor: [
                    "transparent",
                    "transparent",
                    "transparent",
                    "rgba(0, 0, 0, .1)",
                  ],
                }}
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Transcoding:
                    </Box>{" "}
                    1000 minutes / month
                  </span>
                }
              />
              <Item
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Storage:
                    </Box>{" "}
                    None
                  </span>
                }
                displayX={true}
                displayCheck={false}
              />
              <Item
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Streaming:
                    </Box>{" "}
                    10 concurrent viewers / account
                  </span>
                }
                displayCheck={true}
              />
            </List>
          </Box>
          <Box
            className="upgrade-card"
            sx={{
              width: ["100%", "100%", "100%", "25%"],
              bg: "primary",
              color: "white",
              boxShadow: "0px 4px 34px rgba(0, 0, 0, 0.08)",
              borderRadius: "16px",
              p: 4,
              minWidth: 300,
            }}>
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
                variant: "secondarySmall",
              }}
              onClick={() => {
                if (dashboard) {
                  setIsTourOpen(false);
                  setSelectedProduct("prod_1");
                  setSubscriptionModalOpen(true);
                } else {
                  router.push("/register?selectedPlan=1");
                }
              }}
            />

            <List>
              <Item
                styles={{ borderColor: "rgba(255, 255, 255, .3)" }}
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Transcoding:
                    </Box>{" "}
                    $0.005 USD / min video ingested
                  </span>
                }
                color="pink"
              />
              <Item
                styles={{ borderColor: "rgba(255, 255, 255, .3)" }}
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Storage:
                    </Box>{" "}
                    Coming soon
                  </span>
                }
                color="pink"
              />
              <Item
                styles={{ borderColor: "rgba(255, 255, 255, .3)" }}
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Streaming:
                    </Box>{" "}
                    $0.01 USD / gb video streamed
                  </span>
                }
                color="pink"
              />
            </List>
          </Box>
          <Box
            sx={{
              background:
                "linear-gradient(180deg, #FAFAFA 0%, rgba(255, 255, 255, 0) 100%)",
              borderRadius: 16,
              p: 4,
              width: ["100%", "100%", "100%", "25%"],
              minWidth: 300,
            }}>
            <Header
              title={products["prod_2"].name}
              subtitle="Custom pricing"
              cta={{
                text: dashboard
                  ? stripeProductId === "prod_2"
                    ? "Current plan"
                    : "Contact us"
                  : "Contact us",
                disabled:
                  dashboard && stripeProductId === "prod_2" ? true : false,
                variant: "primarySmall",
              }}
              onClick={() => {
                router.push(
                  "/contact?utm_source=livepeer.com&utm_medium=internal_page&utm_campaign=business_plan"
                );
              }}
            />

            <List>
              <Item
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Transcoding:
                    </Box>{" "}
                    Custom pricing available
                  </span>
                }
                color="purple"
              />
              <Item
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Storage:
                    </Box>{" "}
                    Coming soon
                  </span>
                }
                color="purple"
              />
              <Item
                title={
                  <span>
                    <Box
                      as="span"
                      sx={{ display: ["inline", "inline", "inline", "none"] }}>
                      Streaming:
                    </Box>{" "}
                    Custom pricing available
                  </span>
                }
                color="purple"
              />
            </List>
          </Box>
        </Flex>
        <Container
          sx={{
            fontSize: 1,
            textAlign: "center",
            maxWidth: 800,
            mt: 5,
            mx: "auto",
            fontStyle: "italic",
            color: "offBlack",
          }}>
          *Currently, we are not charging for Streaming. We’ll be sure to reach
          out before we start to do so. Thanks for streaming with Livepeer.com.
        </Container>
      </Box>
    </>
  );
};

export default Plans;
