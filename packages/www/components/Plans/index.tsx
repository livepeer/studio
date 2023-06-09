import {
  Container,
  Box,
  Flex,
  Heading,
  Button,
  Text,
  styled,
  Tooltip,
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
      textAlign: "center",
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
  newStripeProductId?: string;
};

const Plans = ({
  dashboard = false,
  stripeProductId,
  newStripeProductId,
}: PlanProps) => {
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
          }}>
          <Box
            css={{
              pl: 4,
              width: "25%",
              maxWidth: 200,
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
              <Item displayCheck={false} css={{ borderBottom: 0 }} title={""} />
            </List>
          </Box>
          <Box
            css={{
              p: "$4",
              borderRadius: 16,
              width: "15%",
              background: "$green3",
              minWidth: 250,
              mr: "$2",
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
                textAlign: "center",
              }}>
              <Heading as="h3" size="3" css={{ mb: "$3", fontWeight: 600 }}>
                {products["hacker_1"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Free</Box>
              <PlanForm
                text={
                  dashboard
                    ? newStripeProductId === "hacker_1"
                      ? "Current plan"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && newStripeProductId === "hacker_1" ? true : false
                }
                variant="primary"
                bc="$sage12"
                color="$loContrast"
                stripeProductId="hacker_1"
                onClick={() => {
                  if (!dashboard) {
                    router.push("/register");
                  }
                }}
              />
            </Flex>
            <List>
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>1,000 minutes</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>1,000 minutes</span>
                  </Flex>
                }
                displayX={false}
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>10,000 minutes</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item css={{ borderBottom: 0 }} displayCheck={false} title={""} />
            </List>
          </Box>
          <Box
            className="upgrade-card"
            css={{
              width: "15%",
              color: "$hiContrast",
              boxShadow: "0px 4px 34px rgba(0, 0, 0, 0.1)",
              borderRadius: "16px",
              background: "$green5",
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
                textAlign: "center",
              }}>
              <Heading as="h3" size="3" css={{ mb: "$3", fontWeight: 600 }}>
                {products["growth_1"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>$100/month</Box>
              <PlanForm
                text={
                  dashboard
                    ? newStripeProductId === "growth_1"
                      ? "Current plan"
                      : newStripeProductId === "scale_1"
                      ? "Select"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && newStripeProductId === "growth_1" ? true : false
                }
                variant="primary"
                bc="$sage12"
                color="$loContrast"
                stripeProductId="growth_1"
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
                displayCheck={false}
                css={{ borderColor: "$neutral5" }}
                title={
                  <Flex css={{ width: "100%", justifyContent: "center" }}>
                    <span>3,000 minutes</span>
                    <Tooltip
                      multiline
                      content="Then $5 per extra 1,000 minutes">
                      <Flex
                        css={{
                          borderRadius: 1000,
                          bc: "$sage12",
                          color: "white",
                          width: 18,
                          height: 18,
                          fontSize: "$1",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "default",
                          ml: "$2",
                        }}>
                        $
                      </Flex>
                    </Tooltip>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5" }}
                title={
                  <Flex css={{ width: "100%", justifyContent: "center" }}>
                    <span>10,000 minutes</span>
                    <Tooltip
                      multiline
                      content="Then $3 per extra 1,000 minutes">
                      <Flex
                        css={{
                          borderRadius: 1000,
                          bc: "$sage12",
                          color: "white",
                          width: 18,
                          height: 18,
                          fontSize: "$1",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "default",
                          ml: "$2",
                        }}>
                        $
                      </Flex>
                    </Tooltip>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={
                  <Flex css={{ width: "100%", justifyContent: "center" }}>
                    <span>100,000 minutes</span>
                    <Tooltip
                      multiline
                      css={{ float: "right" }}
                      content="Then $0.40 per extra 1,000 minutes">
                      <Flex
                        css={{
                          borderRadius: 1000,
                          bc: "$sage12",
                          color: "white",
                          width: 18,
                          height: 18,
                          fontSize: "$1",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "default",
                          ml: "$2",
                        }}>
                        $
                      </Flex>
                    </Tooltip>
                  </Flex>
                }
              />
              <Item
                css={{ borderBottom: 0 }}
                displayCheck={false}
                title={"*Pay as you go past alloted minutes"}
              />
            </List>
          </Box>

          <Box
            className="upgrade-card"
            css={{
              width: "15%",
              color: "$hiContrast",
              boxShadow: "0px 4px 34px rgba(0, 0, 0, 0.1)",
              borderRadius: "16px",
              background: "$green6",
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
                textAlign: "center",
              }}>
              <Heading as="h3" size="3" css={{ mb: "$3", fontWeight: 600 }}>
                {products["scale_1"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>$500/month</Box>
              <PlanForm
                text={
                  dashboard
                    ? newStripeProductId === "scale_1"
                      ? "Current plan"
                      : newStripeProductId === "scale_1"
                      ? "Select"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && newStripeProductId === "scale_1" ? true : false
                }
                variant="primary"
                bc="$sage12"
                color="$loContrast"
                stripeProductId="scale_1"
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
                displayCheck={false}
                css={{ borderColor: "$neutral5" }}
                title={
                  <Flex css={{ width: "100%", justifyContent: "center" }}>
                    <span>20,000 minutes</span>
                    <Tooltip
                      multiline
                      content="Then $5 per extra 1,000 minutes">
                      <Flex
                        css={{
                          borderRadius: 1000,
                          bc: "$sage12",
                          color: "white",
                          width: 18,
                          height: 18,
                          fontSize: "$1",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "default",
                          ml: "$2",
                        }}>
                        $
                      </Flex>
                    </Tooltip>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5" }}
                title={
                  <Flex css={{ width: "100%", justifyContent: "center" }}>
                    <span>50,000 minutes</span>
                    <Tooltip
                      multiline
                      content="Then $3 per extra 1,000 minutes">
                      <Flex
                        css={{
                          borderRadius: 1000,
                          bc: "$sage12",
                          color: "white",
                          width: 18,
                          height: 18,
                          fontSize: "$1",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "default",
                          ml: "$2",
                        }}>
                        $
                      </Flex>
                    </Tooltip>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={
                  <Flex css={{ width: "100%", justifyContent: "center" }}>
                    <span>500,000 minutes</span>
                    <Tooltip
                      multiline
                      content="Then $0.40 per extra 1,000 minutes">
                      <Flex
                        css={{
                          borderRadius: 1000,
                          bc: "$sage12",
                          color: "white",
                          width: 18,
                          height: 18,
                          fontSize: "$1",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "default",
                          ml: "$2",
                        }}>
                        $
                      </Flex>
                    </Tooltip>
                  </Flex>
                }
              />
              <Item
                css={{ borderBottom: 0 }}
                displayCheck={false}
                title={"*Pay as you go past alloted minutes"}
              />
            </List>
          </Box>

          <Box
            css={{
              borderRadius: 16,
              p: "$4",
              width: "15%",
              minWidth: 250,
              mr: "$2",
              background: "$green7",
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
                textAlign: "center",
              }}>
              <Heading as="h3" size="3" css={{ mb: "$3", fontWeight: 600 }}>
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
                  css={{
                    background: "$sage12",
                    border: "none",
                    color: "$loContrast",
                    cursor: "pointer",
                    borderRadius: "$3",
                    "&:hover": {
                      boxShadow: "none",
                      background: "$sage12",
                      color: "$loContrast",
                    },
                  }}>
                  Contact Us
                </Button>
              </Link>
            </Flex>

            <List>
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Custom pricing</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Custom pricing</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Custom pricing</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item css={{ borderBottom: 0 }} displayCheck={false} title={""} />
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
      </Box>
    </>
  );
};

export default Plans;
