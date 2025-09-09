import {
  Container,
  Box,
  Flex,
  Heading,
  Text,
  styled,
  Tooltip,
} from "@livepeer/design-system";
import { Button } from "components/ui/button";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import PlanForm from "components/PlanForm";
import { products } from "@livepeer.studio/api/src/config";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import ContactDialog from "../ContactDialog";

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
};

const Plans = ({ dashboard = false, stripeProductId }: PlanProps) => {
  const [open, setOpen] = useState(false);
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
              minWidth: 120,
              maxWidth: 200,
            }}>
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "flex-end",
                height: 116,
                fontWeight: 600,
                fontSize: "$4",
              }}>
              Usage
            </Flex>
            <List>
              <Item
                css={{
                  borderBottom: 0,
                  textDecoration: "underline dotted rgb(67, 76, 88)",
                  fontSize: "$3",
                }}
                displayCheck={false}
                title={
                  <Tooltip
                    multiline
                    content=" Create multiple versions of your source stream for different
                    devices in real time.">
                    <Text
                      size="3"
                      css={{
                        fontWeight: 600,
                        mb: "$1",
                        textDecoration: "underline dotted rgb(67, 76, 88)",
                        cursor: "default",
                      }}>
                      Transcoding
                    </Text>
                  </Tooltip>
                }
              />
              <Item
                css={{
                  borderBottom: 0,
                  fontSize: "$3",
                }}
                displayCheck={false}
                title={
                  <Tooltip
                    multiline
                    content="Store video content reliably on decentralized or traditional cloud
                    storage providers.">
                    <Text
                      size="3"
                      css={{
                        fontWeight: 600,
                        mb: "$1",
                        textDecoration: "underline dotted rgb(67, 76, 88)",
                        cursor: "default",
                      }}>
                      Storage
                    </Text>
                  </Tooltip>
                }
              />
              <Item
                displayCheck={false}
                title={
                  <Tooltip
                    multiline
                    content="Deliver high-quality playback with any viewer device and network bandwidth.">
                    <Text
                      size="3"
                      css={{
                        fontWeight: 600,
                        mb: "$1",
                        textDecoration: "underline dotted rgb(67, 76, 88)",
                        cursor: "default",
                      }}>
                      Delivery
                    </Text>
                  </Tooltip>
                }
                css={{
                  borderBottom: 0,
                  fontSize: "$3",
                }}
              />
              <Item
                displayCheck={false}
                title={
                  <Tooltip
                    multiline
                    content="Max amount of concurrent viewers.">
                    <Text
                      size="3"
                      css={{
                        fontWeight: 600,
                        mb: "$1",
                        textDecoration: "underline dotted rgb(67, 76, 88)",
                        cursor: "default",
                      }}>
                      Concurrent Viewers
                    </Text>
                  </Tooltip>
                }
                css={{
                  borderBottom: 0,
                  fontSize: "$3",
                }}
              />
              <Item
                displayCheck={false}
                title={
                  <Tooltip multiline content="Minimum monthly spend.">
                    <Text
                      size="3"
                      css={{
                        fontWeight: 600,
                        mb: "$1",
                        textDecoration: "underline dotted rgb(67, 76, 88)",
                        cursor: "default",
                      }}>
                      Minimum Spend
                    </Text>
                  </Tooltip>
                }
                css={{
                  borderBottom: 0,
                  fontSize: "$3",
                }}
              />
              <Item displayCheck={false} css={{ borderBottom: 0 }} title={""} />
            </List>
          </Box>
          <Box className="bg-card p-4 rounded-lg w-[12%] min-w-[230px] mr-2 outline outline-1 outline-accent">
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
                textAlign: "center",
              }}>
              <Heading as="h3" size="3" css={{ mb: "$3", fontWeight: 600 }}>
                {products["prod_O9XuIjn7EqYRVW"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Free</Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "prod_O9XuIjn7EqYRVW"
                      ? "Current plan"
                      : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "prod_O9XuIjn7EqYRVW"
                    ? true
                    : false
                }
                variant="primary"
                bc="$sage12"
                color="$loContrast"
                stripeProductId="prod_O9XuIjn7EqYRVW"
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
                    <span>1,000 minutes / month</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>60 minutes / month</span>
                  </Flex>
                }
                displayX={false}
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>5,000 minutes / month</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Up to 30</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>None</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item css={{ borderBottom: 0 }} displayCheck={false} title={""} />
            </List>
          </Box>
          <Box className="bg-card p-4 rounded-lg w-[12%] min-w-[230px] mr-2 outline outline-1 outline-accent">
            <Flex
              css={{
                mb: "$4",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 116,
                textAlign: "center",
              }}>
              <Heading as="h3" size="3" css={{ mb: "$3", fontWeight: 600 }}>
                {products["prod_O9XtHhI6rbTT1B"].name}
              </Heading>
              <Box css={{ mb: "$4", fontSize: "$2" }}>Pay as you go</Box>
              <PlanForm
                text={
                  dashboard
                    ? stripeProductId === "prod_O9XtHhI6rbTT1B"
                      ? "Current plan"
                      : stripeProductId === "prod_O9XtcfOSMjSD5L"
                        ? "Select"
                        : "Select"
                    : "Sign up"
                }
                disabled={
                  dashboard && stripeProductId === "prod_O9XtHhI6rbTT1B"
                    ? true
                    : false
                }
                variant="primary"
                bc="$sage12"
                color="$loContrast"
                stripeProductId="prod_O9XtHhI6rbTT1B"
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
                  <Flex
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <span>$0.33 / 60 minutes</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5" }}
                title={
                  <Flex
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <span>$0.09 / 60 minutes</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={
                  <Flex
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <span>$0.03 / 60 minutes</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={
                  <Flex
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <span>Up to 50,000</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                css={{ borderColor: "$neutral5", borderBottom: 0 }}
                title={
                  <Flex
                    css={{
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                    <span>$100 minimum spend * </span>
                  </Flex>
                }
              />
              <Item
                css={{
                  borderBottom: 0,
                  fontSize: "11px",
                  justifyContent: "center",
                }}
                displayCheck={false}
                title={"* (we round up if below $100)"}
              />
            </List>
          </Box>

          <Box className="bg-card p-4 rounded-lg w-[12%] min-w-[230px] mr-2 outline outline-1 outline-accent">
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
              <Box css={{ mb: "$4", fontSize: "$2" }}>Volume Discounts</Box>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setOpen(true)}>
                Contact Us
              </Button>
              <ContactDialog open={open} setOpen={setOpen} />
            </Flex>

            <List>
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Custom quote</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Custom quote</span>
                  </Flex>
                }
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Custom quote</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>Unlimited</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item
                displayCheck={false}
                title={
                  <Flex css={{ justifyContent: "center", width: "100%" }}>
                    <span>$2.5k minimum spend</span>
                  </Flex>
                }
                css={{ borderBottom: 0 }}
              />
              <Item
                css={{
                  borderBottom: 0,
                  fontSize: "11px",
                  justifyContent: "center",
                }}
                displayCheck={false}
                title={"* with annual commit"}
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
          }}></Container>
      </Box>
    </>
  );
};

export default Plans;
