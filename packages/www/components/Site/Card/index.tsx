import { Box, Flex, Text, Link as A } from "@livepeer/design-system";
import CutOut from "@components/Site/CutOut";
import Badge from "@components/Site/Badge";

type Cta = {
  href?: string;
  isExternal?: boolean;
};

interface Props {
  bc?: string;
  color?: string;
  lines?: "midnight" | "tomato" | null;
  lineCount?: 4 | 5;
  height: number | string;
  label?: string;
  title?: string;
  description: string;
  arrow?: boolean;
  cta?: Cta;
}

export const Card = ({
  bc = "white",
  color = "$loContrast",
  lines = null,
  lineCount = 4,
  height = "auto",
  label = "",
  title = "",
  description = "",
  arrow = false,
  cta = {
    href: null,
    isExternal: false,
  },
}: Props) => (
  <Box
    as={cta ? A : Box}
    href={cta ? cta.href : null}
    target={cta.isExternal ? "_blank" : null}
    css={{
      textDecoration: "none",
      "&:hover": {
        textDecoration: "none",
      },
    }}>
    <Box css={{ position: "relative", height: 32 }}>
      <CutOut backgroundColor={bc} />
    </Box>
    <Box
      css={{
        bc,
        height: typeof height === "number" ? height * 0.75 : height,
        position: "relative",
        borderBottomLeftRadius: "12px",
        borderBottomRightRadius: "12px",
        borderTopRightRadius: "12px",
        p: lines ? "$1" : "$2",
        "@bp2": {
          height,
          p: "$2",
        },
      }}>
      {!lines ? (
        <Box css={{ mt: -16 }}>
          <Badge css={{ mb: "$1" }} color={color}>
            {label}
          </Badge>
          <Box
            css={{
              fontWeight: 600,
              fontSize: 51,
              color,
              lineHeight: 1,
              mb: "$2",
              letterSpacing: "-2px",
              "@bp2": {
                fontSize: 76,
              },
            }}>
            {title}
          </Box>
          <Text
            size="6"
            css={{
              lineHeight: 1.2,
              color,
              fontSize: "$3",
              "@bp2": {
                fontSize: "$5",
              },
            }}>
            {description}
          </Text>
        </Box>
      ) : (
        <Box css={{ mt: -2, height: "100%" }}>
          <Flex direction="column" css={{ height: "100%" }}>
            <Box css={{ ml: "$2", mt: -16 }}>
              <Badge css={{ mb: "$1" }} color={color}>
                {label}
              </Badge>
              <Box
                css={{
                  fontWeight: 600,
                  fontSize: 51,
                  color,
                  lineHeight: 1,
                  mb: "$2",
                  letterSpacing: "-2px",
                  "@bp2": {
                    fontSize: 76,
                  },
                }}>
                {title}
              </Box>
            </Box>
            <Box css={{ position: "relative", height: "100%" }}>
              <Box
                css={{
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  bc: lines === "midnight" ? "#0001AE" : "#D00239",
                  height: 23,
                  mt: -8,
                  width: "100%",
                  "@bp2": {
                    height: 28,
                  },
                }}
              />
              <Box
                css={{
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  bc: lines === "midnight" ? "#0A5CD8" : "#D34221",
                  height: 23,
                  mt: -8,
                  width: "100%",
                  "@bp2": {
                    height: 28,
                  },
                }}
              />
              <Box
                css={{
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  bc: lines === "midnight" ? "#0197D5" : "#E2593A",
                  height: 23,
                  mt: -8,
                  width: "100%",
                  "@bp2": {
                    height: 28,
                  },
                }}
              />
              <Box
                css={{
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  bc: lines === "midnight" ? "#37B8EE" : "#E9785F",
                  height: 23,
                  mt: -8,
                  width: "100%",
                  "@bp2": {
                    height: 28,
                  },
                }}
              />
              <Box
                css={{
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  bc: lines === "midnight" ? "#95D8F3" : "#FF9D87",
                  height: 23,
                  mt: -8,
                  width: "100%",
                  "@bp2": {
                    height: 28,
                  },
                }}
              />
              {lineCount === 5 && (
                <Box
                  css={{
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    bc: lines === "midnight" ? "#BFE7F8" : "#F3CFC0",
                    height: 23,
                    mt: -8,
                    width: "100%",
                    "@bp2": {
                      height: 28,
                    },
                  }}
                />
              )}
              {arrow && (
                <Box
                  css={{
                    bc,
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    pl: "7px",
                    pt: "7px",
                  }}>
                  <svg
                    width="51"
                    height="51"
                    viewBox="0 0 51 51"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3.50195 47.4194L47.4214 3.5M47.4214 3.5V47.4194M47.4214 3.5H3.50195"
                      stroke="#000116"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
              )}

              <Box
                css={{
                  borderRadius: "8px",
                  bc: lines === "midnight" ? "#E4F4FC" : "#FFECE4",
                  width: "100%",
                  height: `calc(100% - ${lineCount === 5 ? "80px" : "66px"})`,
                  mt: -8,
                  "@bp2": {
                    height: `calc(100% - ${
                      lineCount === 5 ? "112px" : "92px"
                    })`,
                  },
                }}>
                <Text
                  css={{
                    lineHeight: 1.2,
                    p: "$4",
                    color,
                    fontSize: "$3",
                    "@bp2": {
                      fontSize: "$5",
                    },
                  }}>
                  {description}
                </Text>
              </Box>
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  </Box>
);
export default Card;
