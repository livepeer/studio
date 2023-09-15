import {
  Container,
  Box,
  Heading,
  Text,
  Flex,
  Grid,
} from "@livepeer/design-system";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@livepeer/design-system";
import { MdTaskAlt } from "react-icons/md";
import Guides from "components/Site/Guides";

const workflows = [
  {
    selected: true,
    title: "🔴 Live",
    description: (
      <Text size={7} css={{ maxWidth: 520, mx: "auto" }}>
        Build live video experiences with just few lines of code — affordably,
        at scale, and with no vendor lock-in.
      </Text>
    ),
    list: [
      {
        heading: "Go live effortlessly from any source",
        subheading:
          "Stream seamlessly from mobile apps or broadcast software to any device with an optimized viewing experience.",
      },
      {
        heading: "Protect your streams with token-based access controls",
        subheading:
          "Control who has access to livestreams and for how long with token and wallet-based access controls.",
      },
      {
        heading: "Build low-latency livestreaming experiences",
        subheading:
          "Latency as low as two seconds enables natural interactive experiences between audiences and content creators.",
      },
      {
        heading: "Get real-time viewership and performance health",
        subheading: "Understand engagement and improve the viewer experience.",
      },
    ],
  },
  {
    title: "⏯️ On-demand",
    description: (
      <Text size={7} css={{ maxWidth: 480, mx: "auto" }}>
        Deliver high-quality on-demand video experiences to viewers worldwide.
      </Text>
    ),
    list: [
      {
        heading: "Upload any common video format",
        subheading:
          "The Livepeer Network ensures standardization for seamless playback on any device or connection.",
      },
      {
        heading: "Ensure high-quality, optimized streaming",
        subheading:
          "Livepeer generates multiple video resolutions ensuring an optimized streaming experience based on the user's device and available bandwidth.",
      },
      {
        heading: "Understand your audience",
        subheading:
          "Leveraging real-time engagement metrics such as view counts and watch time.",
      },
      {
        heading: "Optimize the viewer experience",
        subheading:
          "Monitor and optimize the viewer experience with performance metrics such as error rate, time to first frame, and more.",
      },
    ],
  },
  {
    title: "🔄 Transcode",
    description: (
      <Text size={7} css={{ maxWidth: 500, mx: "auto" }}>
        Tap into a global network of always-on transcoding providers.
      </Text>
    ),
    list: [
      {
        heading: "Write results to any S3-compatible storage provider",
        subheading:
          "Livepeer’s transcoding pipeline is designed to plug and play with any S3-compatible storage provider.",
      },
      {
        heading: "Scale your transcoding capacity without limits",
        subheading:
          "The Livepeer Network's represents enough bandwidth to transcode all the real-time video streaming through Twitch, Facebook, and Youtube combined.",
      },
      {
        heading: "Save 10x on transcoding costs",
        subheading:
          "Livepeer, a people-powered network, avoids cloud computing competition with Google Cloud and AWS, offering cost-effective usage-based pricing, not reserved server space.",
      },
    ],
  },
];

const TT = ({ title, value }) => (
  <TabsTrigger
    css={{
      transitionProperty: "all",
      transitionTimingFunction: "cubic-bezier(.4,0,.2,1)",
      transitionDuration: ".15s",
      border: 0,
      fontSize: "$2",
      fontWeight: 600,
      color: "#71717a",
      p: "$3",
      cursor: "pointer",
      minWidth: 110,
      "@bp1": {
        fontSize: "$4",
        p: "$5",
        minWidth: 130,
      },
    }}
    value={value}>
    <Box>{title}</Box>
  </TabsTrigger>
);

export const StartBuilding = ({ backgroundColor = "$loContrast" }) => (
  <Box css={{ position: "relative" }}>
    <Guides backgroundColor={backgroundColor} />
    <Container size={3} css={{ pt: 100, pb: 50, position: "relative" }}>
      <Box css={{ textAlign: "center" }}>
        <Text
          css={{
            mb: "$7",
            maxWidth: 880,
            mx: "auto",
            lineHeight: 1,
            fontWeight: 700,
            fontSize: "$8",
            "@bp2": {
              fontSize: 50,
              letterSpacing: "-2px",
            },
          }}>
          One API for all your video workflows
        </Text>
      </Box>
      <Tabs
        defaultValue="tab-0"
        css={{
          maxWidth: 1060,
          mx: "auto",
          justifyContent: "center",
        }}>
        <TabsList
          css={{
            alignSelf: "center",
            width: "auto",
            padding: "$1",
            bc: "$neutral5",
            borderRadius: 8,
            '[role="separator"]': {
              display: "none",
            },
            '[data-state="active"]': {
              borderRadius: 6,
              bc: "white",
              color: "$hiContrast",
              boxShadow:
                "0px 30px 30px rgba(0, 0, 0, 0.02), 0px 0px 8px rgba(0, 0, 0, 0.03), 0px 1px 0px rgba(0, 0, 0, 0.05)",
            },
          }}>
          {workflows.map(({ title }, i) => (
            <TT key={`tab-${i}`} value={`tab-${i}`} title={title} />
          ))}
        </TabsList>
        {workflows.map(({ list }, i) => {
          return (
            <TabsContent key={`tab-${i}`} value={`tab-${i}`}>
              <Text
                size={7}
                css={{
                  textAlign: "center",
                  letterSpacing: "-1px",
                  mx: "auto",
                  marginTop: "$6",
                  marginBottom: 80,
                  position: "relative",
                  lineHeight: 1.3,
                }}>
                {workflows[i].description}
              </Text>
              <Box
                css={{
                  height: "1px",
                  width: "100%",
                  background:
                    "linear-gradient(var(--direction),transparent,rgba(0,0,0,0.1) 50%,transparent)",
                }}
              />
              <Grid
                css={{
                  mb: "$9",
                  gap: 40,
                  gridTemplateColumns: `repeat(1, fit-content(100%))`,
                  "@bp1": {
                    gridTemplateColumns: `repeat(2, fit-content(100%))`,
                  },
                }}>
                {list?.map(({ heading, subheading }, i) => {
                  return (
                    <Box key={`workflow-list-${i}`}>
                      <Flex>
                        <Box
                          css={{
                            fontSize: "22px",
                            marginRight: 24,
                            marginTop: "3px",
                            marginBottom: 40,
                          }}>
                          <MdTaskAlt />
                        </Box>
                        <Box>
                          <Text
                            css={{
                              fontWeight: 600,
                              marginBottom: 1,
                              fontSize: 18,
                            }}>
                            {heading}
                          </Text>
                          <Text css={{ fontSize: 18 }}>{subheading}</Text>
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </Grid>
            </TabsContent>
          );
        })}
      </Tabs>
    </Container>
  </Box>
);

export default StartBuilding;
