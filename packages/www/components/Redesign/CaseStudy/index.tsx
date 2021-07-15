import {
  Container,
  Box,
  Flex,
  Text,
  Grid,
  Heading,
  Link as A,
} from "@livepeer.com/design-system";
import Guides from "components/Redesign/Guides";
import Link from "next/link";
import Image from "next/image";

const CaseStudy = ({ heading, about, problem, solution, internalLink }) => {
  return (
    <Box>
      <Guides backgroundColor="$loContrast" />
      <Box css={{ position: "relative", py: 120 }}>
        <Container size="3" css={{ p: 0, width: "100%" }}>
          <Grid
            css={{
              gap: "$6",
              grid: "1fr/repeat(2,1fr)",
              width: "100%",
              mb: "$6",
            }}>
            <Flex direction="column">
              <Box css={{ px: "$4" }}>
                <Text
                  variant="violet"
                  size="5"
                  css={{ fontWeight: 600, mb: "$4" }}>
                  Case Study
                </Text>
                <Heading
                  size="3"
                  css={{
                    maxWidth: 600,
                    lineHeight: 1.4,
                    fontWeight: 700,
                    mb: "$7",
                    "@bp2": { lineHeight: 1.4, letterSpacing: 0 },
                  }}>
                  {heading}
                </Heading>
              </Box>
              <Box
                css={{
                  display: "grid",
                  grid: "1fr/repeat(1,1fr)",
                  position: "relative",
                  height: "100%",
                  maxWidth: 475,
                }}>
                <Box css={{ mb: "$6", pl: "$4", pr: "$6", width: "100%" }}>
                  <Text
                    css={{
                      position: "relative",
                      fontWeight: 500,
                      mb: "$2",
                      "&:before": {
                        position: "absolute",
                        top: "4px",
                        left: "-20px",
                        width: "1px",
                        height: "$3",
                        backgroundColor: "$violet9",
                        content: '""',
                      },
                    }}>
                    Problem
                  </Text>
                  <Text variant="gray" css={{ lineHeight: 1.6 }}>
                    {problem}
                  </Text>
                </Box>
                <Box css={{ mb: "$6", pl: "$4", pr: "$6", width: "100%" }}>
                  <Text
                    css={{
                      position: "relative",
                      fontWeight: 500,
                      mb: "$2",
                      "&:before": {
                        position: "absolute",
                        top: "4px",
                        left: "-20px",
                        width: "1px",
                        height: "$3",
                        backgroundColor: "$violet9",
                        content: '""',
                      },
                    }}>
                    Solution
                  </Text>
                  <Text variant="gray" css={{ lineHeight: 1.6, mb: "$3" }}>
                    {solution}
                  </Text>
                  {internalLink && (
                    <Link href={`/blog/${internalLink.slug.current}`} passHref>
                      <A css={{ fontSize: "$3" }} variant="violet">
                        Read the full story
                      </A>
                    </Link>
                  )}
                </Box>
              </Box>
            </Flex>
            <Box css={{ pt: "$7" }}>
              <Text variant="gray" size="5" css={{ mb: "$7" }}>
                {about}
              </Text>
              <Box
                css={{
                  borderRadius: "8px",
                  boxShadow: "0px 14px 34px rgba(0, 0, 0, 0.21)",
                  overflow: "visible",
                  position: "relative",
                  width: 540,
                  height: 430,
                }}>
                <Box
                  as={Image}
                  css={{ borderRadius: "8px" }}
                  src="/img/korkuma.jpg"
                  width="540"
                  height="430"
                />
              </Box>
            </Box>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default CaseStudy;
