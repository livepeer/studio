import {
  Container,
  Box,
  Flex,
  Heading,
  Button,
  styled,
} from "@livepeer.com/design-system";
import { MdCheck, MdClose, MdCreditCard } from "react-icons/md";
import { CheckIcon, Cross2Icon, IdCardIcon } from "@radix-ui/react-icons";
import PlanForm from "../PlanForm";
import { products } from "@livepeer.com/api/src/config";
import useApi from "hooks/use-api";
import PaymentMethodDialog from "@components/Dashboard/PaymentMethodDialog";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Modal from "components/Modal";
import Link from "next/link";

const Tour: any = dynamic(() => import("reactour"), { ssr: false });
const steps = [
  {
    selector: ".upgrade-card",
    content: `Welcome to Livepeer.com! You're currently subscribed to the free plan. Click "Upgrade" to enter your credit card information and switch over to the pay-as-you-go plan for unlimited transcoding minutes.`,
  },
];

const StyledIcon = ({ icon, css }) => {
  const Test = styled(icon, {
    ...css,
  });
  return <Test />;
};

const Item = ({
  title,
  displayCheck = true,
  displayX = false,
  color = "$hiContrast",
  css = null,
}) => (
  <Flex
    css={{
      fontSize: "$2",
      height: 50,
      alignItems: "center",
      borderBottom: "1px solid",
      letterSpacing: -0.3,
      borderColor: "$mauve5",
      ...css,
    }}>
    {displayCheck && (
      <StyledIcon icon={CheckIcon} css={{ mr: "$3", color: color }} />
    )}
    {displayX && (
      <StyledIcon icon={Cross2Icon} css={{ mr: "$3", color: color }} />
    )}
    {title}
  </Flex>
);

const List = ({ children, ...props }) => (
  <Box css={{ pb: 3 }} {...props}>
    {children}
  </Box>
);

type PlanProps = {
  dashboard?: boolean;
  stripeProductId?: string;
};

const Plans = ({ dashboard = false, stripeProductId }: PlanProps) => {
  const router = useRouter();
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

      {/* {dashboard && (
        <Box css={{ width: "100%", pb: "$4", borderColor: "$mauve5" }}>
          <Box css={{ width: "100%" }}>
            <Box css={{ mb: "$4", color: "$hiContrast" }}>
              You are currently on the{" "}
              <span
                css={{
                  textTransform: "uppercase",
                  fontSize: "$2",
                  borderRadius: 1000,
                  py: 0,
                  px: 2,
                  color: "black",
                  border: "1px solid",
                  borderColor: "$mauve5",
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
              css={{
                px: "$3",
                py: "12px",
                borderRadius: 6,
                bg: "rgba(0,0,0,.02)",
                border: "1px solid",
                borderColor: "$mauve5",
              }}>
              <Flex
                css={{
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "space-between",
                }}>
                <Flex css={{ color: "text", alignItems: "center", mr: "$4" }}>
                  <MdCreditCard css={{ mr: "$3", fontSize: "$4" }} />{" "}
                  <Box css={{ fontSize: "$2", mr: "$3" }}>Credit Card: </Box>
                  <Box
                    css={{
                      textTransform: "capitalize",
                      mr: "$4",
                      fontSize: "$2",
                    }}>
                    {user.ccBrand} •••• {user.ccLast4}
                  </Box>
                </Flex>

                <Button
                  variant="violet"
                  onClick={() => {
                    setUpdatePaymentModal(true);
                  }}>
                  Change
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      )} */}
      <Box
        css={{
          borderRadius: 16,
          position: "relative",
          py: 5,
          mb: 100,
        }}>
        <Flex
          css={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box
            css={{
              pl: 4,
              width: "25%",
              maxWidth: 174,
            }}>
            <Flex
              css={{
                mb: "$4",
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
              <Item
                displayCheck={false}
                title="Streaming*"
                css={{ borderBottom: 0 }}
              />
            </List>
          </Box>
          <Box
            css={{
              p: "$4",
              borderRadius: 16,
              width: "25%",
              minWidth: 300,
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
              }}>
              <Heading as="h3" size="2" css={{ mb: "$3" }}>
                {products["prod_0"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Free</Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "prod_0"
                      ? "Current plan"
                      : "Downgrade"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "prod_0" ? true : false
                }
                variant="violet"
                stripeProductId="prod_0"
                onClick={() => {
                  if (!dashboard) {
                    router.push("/register");
                  }
                }}
              />
            </Flex>
            <List>
              <Item
                title={
                  <span>
                    <span css={{ display: "none" }}>Transcoding:</span> 1000
                    minutes / month
                  </span>
                }
              />
              <Item
                title={
                  <span>
                    <span css={{ display: "none" }}>Storage:</span> None
                  </span>
                }
                displayX={true}
                displayCheck={false}
              />
              <Item
                title={
                  <span>
                    <span css={{ display: "none" }}>Streaming:</span> 10
                    concurrent viewers / account
                  </span>
                }
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
            </List>
          </Box>
          <Box
            className="upgrade-card"
            css={{
              width: "25%",
              color: "$hiContrast",
              boxShadow: "0px 4px 34px rgba(0, 0, 0, 0.1)",
              borderRadius: "16px",
              background: "$panel",
              p: "$4",
              minWidth: 300,
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
              }}>
              <Heading as="h3" size="2" css={{ mb: "$3" }}>
                {products["prod_1"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Pay as you go</Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "prod_1"
                      ? "Current plan"
                      : stripeProductId === "prod_2"
                      ? "Downgrade"
                      : "Upgrade"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "prod_1" ? true : false
                }
                variant="violet"
                stripeProductId="prod_1"
                onClick={() => {
                  if (dashboard) {
                    setIsTourOpen(false);
                  } else {
                    router.push("/register?selectedPlan=1");
                  }
                }}
              />
            </Flex>

            <List>
              <Item
                css={{ borderColor: "$mauve5" }}
                title={
                  <span>
                    <span css={{ display: "none" }}>Transcoding:</span> $0.005
                    USD / min video ingested
                  </span>
                }
              />
              <Item
                css={{ borderColor: "$mauve5" }}
                title={
                  <span>
                    <span css={{ display: "none" }}>Storage:</span> Coming soon
                  </span>
                }
              />
              <Item
                css={{ borderColor: "$mauve5", borderBottom: 0 }}
                title={
                  <span>
                    <span css={{ display: "none" }}>Streaming:</span> $0.01 USD
                    / gb video streamed
                  </span>
                }
              />
            </List>
          </Box>
          <Box
            css={{
              borderRadius: 16,
              p: "$4",
              width: "25%",
              minWidth: 300,
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
              }}>
              <Heading as="h3" size="2" css={{ mb: "$3" }}>
                {products["prod_2"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Custom pricing</Box>
              <Link
                href="/contact?utm_source=livepeer.com&utm_medium=internal_page&utm_campaign=business_plan"
                passHref>
                <Button
                  as="a"
                  size="3"
                  onClick={() => {
                    router.push(
                      "/contact?utm_source=livepeer.com&utm_medium=internal_page&utm_campaign=business_plan"
                    );
                  }}
                  variant="indigo">
                  Contact Us
                </Button>
              </Link>
            </Flex>

            <List>
              <Item
                title={
                  <span>
                    <span css={{ display: "none" }}>Transcoding:</span> Custom
                    pricing available
                  </span>
                }
              />
              <Item
                title={
                  <span>
                    <span css={{ display: "none" }}>Storage:</span> Coming soon
                  </span>
                }
              />
              <Item
                title={
                  <span>
                    <span css={{ display: "none" }}>Streaming:</span> Custom
                    pricing available
                  </span>
                }
                css={{ borderBottom: 0 }}
              />
            </List>
          </Box>
        </Flex>
        <Container
          css={{
            fontSize: "$1",
            textAlign: "center",
            maxWidth: 800,
            mt: "$8",
            mx: "auto",
            fontStyle: "italic",
            color: "$hiContrast",
          }}>
          *Currently, we are not charging for Streaming. We’ll be sure to reach
          out before we do.
        </Container>
      </Box>
    </>
  );
};

export default Plans;
