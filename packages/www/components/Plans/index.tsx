import {
  Container,
  Box,
  Flex,
  Heading,
  Button,
  Text,
  styled,
} from "@livepeer/design-system";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import PlanForm from "components/PlanForm";
import { products } from "@livepeer.studio/api/src/config";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";

const Tour: any = dynamic(() => import("reactour"), { ssr: false });
const steps = [
  {
    selector: ".upgrade-card",
    style: {
      padding: 0,
      backgroundColor: "transparent",
    },
    content: (
      <Text
        size="2"
        css={{
          backgroundColor: "$panel",
          padding: "$4",
          borderRadius: 6,
          color: "$hiContrast",
          lineHeight: 1.5,
        }}>
        Welcome to Livepeer Studio! You're currently subscribed to the free
        plan. Click "Upgrade" to enter your credit card information and switch
        over to the pay-as-you-go plan for unlimited transcoding minutes.
      </Text>
    ),
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
      fontSize: "$1",
      height: 50,
      alignItems: "center",
      borderBottom: "1px solid",
      letterSpacing: -0.3,
      borderColor: "$neutral5",
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
        rounded={16}
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
              <Item displayCheck={false} title="Storage" />
              <Item
                displayCheck={false}
                title="Streaming"
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title="Multistreaming"
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title="Recording"
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title="Engagement analytics"
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title="Playback policies"
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title="WebRTC"
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title="Low Latency livestreaming*"
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title="Multiparticipant livestreaming**"
                css={{ borderBottom: 0 }}
              />
            </List>
          </Box>
          <Box
            css={{
              p: "$4",
              borderRadius: 16,
              width: "25%",
              background: "$panel",
              minWidth: 250,
              mr: "$2",
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
              <Box css={{ mb: "$4", fontSize: "$2" }}>
                {products["prod_0"].name}
              </Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "prod_0"
                      ? "Current plan"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "prod_0" ? true : false
                }
                variant="primary"
                stripeProductId="prod_0"
                onClick={() => {
                  if (!dashboard) {
                    router.push("/register");
                  }
                }}
              />
            </Flex>
            <List>
              <Item title={<span>1,000 minutes / month</span>} />
              <Item
                title={<span>1,000 minutes / month</span>}
                displayX={false}
                displayCheck={true}
              />
              <Item
                title={<span>10,000 minutes / month</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
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
              mr: "$2",
              minWidth: 250,
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
              <Box css={{ mb: "$4", fontSize: "$2" }}>$100/month</Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "prod_1"
                      ? "Current plan"
                      : stripeProductId === "prod_2"
                      ? "Select"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "prod_1" ? true : false
                }
                variant="primary"
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
                css={{ borderColor: "$neutral5" }}
                title={<span>3,000 minutes / month</span>}
              />
              <Item
                css={{ borderColor: "$neutral5" }}
                title={<span>10,000 minutes / month</span>}
              />
              <Item
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={<span>100,000 minutes / month</span>}
              />
              <Item
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={<span>Included</span>}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
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
              mr: "$2",
              minWidth: 250,
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
              <Box css={{ mb: "$4", fontSize: "$2" }}>$500/month</Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "prod_2"
                      ? "Current plan"
                      : stripeProductId === "prod_2"
                      ? "Select"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "prod_2" ? true : false
                }
                variant="primary"
                stripeProductId="prod_2"
                onClick={() => {
                  if (dashboard) {
                    setIsTourOpen(false);
                  } else {
                    router.push("/register?selectedPlan=2");
                  }
                }}
              />
            </Flex>

            <List>
              <Item
                css={{ borderColor: "$neutral5" }}
                title={<span>20,000 minutes / month</span>}
              />
              <Item
                css={{ borderColor: "$neutral5" }}
                title={<span>50,000 minutes / month</span>}
              />
              <Item
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={<span>500,000 minutes / month</span>}
              />
              <Item
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={<span>Included</span>}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
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
              mr: "$2",
              minWidth: 250,
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
              }}>
              <Heading as="h3" size="2" css={{ mb: "$3" }}>
                {products["pay_as_you_go_1"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Pay for what you use</Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "pay_as_you_go_1"
                      ? "Current plan"
                      : stripeProductId === "pay_as_you_go_1"
                      ? "Select"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "pay_as_you_go_1"
                    ? true
                    : false
                }
                variant="primary"
                stripeProductId="pay_as_you_go_1"
                onClick={() => {
                  if (dashboard) {
                    setIsTourOpen(false);
                  } else {
                    router.push("/register?selectedPlan=3");
                  }
                }}
              />
            </Flex>

            <List>
              <Item
                css={{ borderColor: "$neutral5" }}
                title={<span>$5 / 1,000 minutes</span>}
              />
              <Item
                css={{ borderColor: "$neutral5" }}
                title={<span>$3 / 1,000 minutes</span>}
              />
              <Item
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={<span>$0.40 / 1,000 minutes</span>}
              />
              <Item
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={<span>Included</span>}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
            </List>
          </Box>

          <Box
            css={{
              borderRadius: 16,
              p: "$4",
              width: "25%",
              minWidth: 250,
              mr: "$2",
              background: "$panel",
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
              }}>
              <Heading as="h3" size="2" css={{ mb: "$3" }}>
                {products["prod_4"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Custom pricing</Box>
              <Link
                href="/contact?utm_source=livepeer.studio&utm_medium=internal_page&utm_campaign=business_plan"
                passHref
                legacyBehavior>
                <Button
                  as="a"
                  size="3"
                  onClick={() => {
                    router.push(
                      "/contact?utm_source=livepeer.studio&utm_medium=internal_page&utm_campaign=business_plan"
                    );
                  }}
                  variant="green">
                  Contact Us
                </Button>
              </Link>
            </Flex>

            <List>
              <Item title={<span>Custom pricing</span>} />
              <Item title={<span>Custom pricing</span>} />
              <Item
                title={<span>Custom pricing</span>}
                css={{ borderBottom: 0 }}
              />
              <Item title={<span>Included</span>} css={{ borderBottom: 0 }} />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
                css={{ borderBottom: 0 }}
              />
              <Item
                title={<span>Included</span>}
                displayCheck={true}
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
          The Pay-as-you-go plan applies to minutes that go over the Hacker,
          Growth, and Scale plans.
        </Container>
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
          *Open Beta **Closed beta
        </Container>
      </Box>
    </>
  );
};

export default Plans;
