import {
  Container,
  Box,
  Flex,
  Text,
  Grid,
  Heading,
} from "@livepeer.com/design-system";
import Guides from "components/Redesign/Guides";
import Button from "components/Redesign/Button";
import Link from "next/link";
import Image from "next/image";

const data = [
  {
    heading: "Problem",
    description:
      "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Commodi repellendus pariatur, est temporibus earum, assumenda voluptates dignissimos, ut sit dolores eveniet! Tempore, hic ducimus in totam minima magni repellendus soluta.",
  },
  {
    heading: "Solution",
    description:
      "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Commodi repellendus pariatur, est temporibus earum, assumenda voluptates dignissimos, ut sit dolores eveniet! Tempore, hic ducimus in totam minima magni repellendus soluta.",
  },
];

const CaseStudy = () => {
  return (
    <Box>
      <Guides />
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
                    "@bp2": { lineHeight: 1.4, letterSpacing: "-1px" },
                  }}>
                  Livepeer.com helps Korkuma bring immersive commerce to the
                  masses
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
                {data.map((item, i) => (
                  <Box
                    key={i}
                    css={{ mb: "$6", pl: "$4", pr: "$6", width: "100%" }}>
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
                      {item.heading}
                    </Text>
                    <Text variant="gray" css={{ lineHeight: 1.6 }}>
                      {item.description}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Flex>
            <Box css={{ pt: "$7" }}>
              <Text variant="gray" size="5" css={{ mb: "$7" }}>
                Korkuma provides tools and resources for organizing, running and
                analysing shared shopping experiences.
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
