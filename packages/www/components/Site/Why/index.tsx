import { Container, Box, Flex, Text, Heading } from "@livepeer/design-system";
import Guides from "components/Site/Guides";
import Link from "next/link";
import * as Hi from "react-icons/hi";
import * as Fa from "react-icons/fa";
import * as Fi from "react-icons/fi";
import * as Md from "react-icons/md";
import Button from "components/Site/Button";
import ArrowLink from "components/Site/ArrowLink";
import { FiArrowUpRight } from "react-icons/fi";

const getIconProvider = (provider) => {
  if (provider === "hi") {
    return Hi;
  }
  if (provider === "fa") {
    return Fa;
  }
  if (provider === "fi") {
    return Fi;
  }
  if (provider === "mdi") {
    return Md;
  }
};

const Why = ({
  backgroundColor = "inherit",
  title = null,
  heading = null,
  description = null,
  reasons,
  columns = 3,
  ctas,
}) => {
  return (
    <Box css={{ position: "relative", bc: backgroundColor }}>
      <Guides backgroundColor={backgroundColor} />
      <Box
        css={{
          position: "relative",
          py: 60,
        }}>
        <Container
          size="3"
          css={{
            p: "$6",
            width: "100%",
            "@bp3": {
              px: "$3",
            },
          }}>
          {heading && (
            <Flex
              css={{
                ai: "flex-start",
                flexDirection: "column",
                width: "100%",
                mb: "$7",
                "@bp2": {
                  mb: "$2",
                  ai: "center",
                  flexDirection: "row",
                },
              }}>
              <Flex direction="column">
                <Text size="4" css={{ fontWeight: 600, mb: "$2" }}>
                  {title}
                </Text>
                <Heading
                  as="h2"
                  size="3"
                  css={{
                    maxWidth: 600,
                    lineHeight: 2,
                    fontWeight: 700,
                    mb: "$2",
                    mr: "$6",
                  }}>
                  {heading}
                </Heading>
              </Flex>
            </Flex>
          )}
          {description && (
            <Text
              css={{ fontWeight: 500, mb: "$6", maxWidth: 600 }}
              variant="neutral"
              size={5}>
              {description}
            </Text>
          )}
          {ctas?.length > 0 && (
            <Flex align="center" justify={"start"} css={{ mb: "$4" }}>
              <Link href={ctas[0].href} passHref legacyBehavior>
                <Button
                  size={4}
                  arrow={!ctas[0]?.isExternal}
                  as="a"
                  css={{ display: "flex", ai: "center", mr: "$4" }}>
                  {ctas[0].title}
                  {ctas[0]?.isExternal && (
                    <FiArrowUpRight style={{ marginLeft: "4px" }} />
                  )}
                </Button>
              </Link>
              {ctas[1] && (
                <ArrowLink css={{ fontSize: "$4" }} href={ctas[1]?.href}>
                  {ctas[1]?.title}
                </ArrowLink>
              )}
            </Flex>
          )}
        </Container>
        <Box
          css={{
            display: "grid",
            grid: "1fr/repeat(1,1fr)",
            position: "relative",
            height: "100%",
            maxWidth: "1145px",
            margin: "0 auto",
            "@bp1": {
              grid: "1fr/repeat(2,1fr)",
            },
            "@bp3": {
              grid: `1fr/repeat(${columns},1fr)`,
            },
          }}>
          {reasons &&
            reasons.map((reason, i) => {
              return (
                <Box
                  key={i}
                  css={{
                    pl: "$6",
                    pr: "$6",
                    width: "100%",
                    mb: "$7",
                    "@bp1": {
                      pl: "$3",
                      "&:nth-child(odd)": {
                        pl: "$6",
                      },
                    },
                    "@bp3": {
                      "&:nth-child(odd)": {
                        pl: "$3",
                      },
                    },
                  }}>
                  {reason?.icon?.provider && (
                    <Box
                      css={{
                        mb: "$3",
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        minHeight: 44,
                        borderRadius: 1000,
                        display: "flex",
                        ai: "center",
                        color: "$hiContrast",
                        jc: "center",
                        background:
                          "linear-gradient(90deg, $green4 0%, $green5 100%)",
                      }}>
                      {getIconProvider(reason.icon.provider)[
                        reason.icon.name
                      ]()}
                    </Box>
                  )}
                  <Text
                    css={{
                      position: "relative",
                      fontWeight: 500,
                      mb: "$2",
                      // "&:before": {
                      //   position: "absolute",
                      //   top: "4px",
                      //   left: "-$space$3",
                      //   width: "1px",
                      //   height: "$3",
                      //   backgroundColor: "$green9",
                      //   content: '""',
                      // },
                    }}>
                    {reason.title}
                  </Text>
                  <Text variant="gray" css={{ lineHeight: 1.6 }}>
                    {reason.description}
                  </Text>
                </Box>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
};

export default Why;
