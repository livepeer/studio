import {
  Container,
  Box,
  Flex,
  Text,
  Heading,
} from "@livepeer.com/design-system";
import Guides from "components/Redesign/Guides";
import Button from "components/Redesign/Button";
import Link from "next/link";

const Why = ({ backgroundColor = "$panel", title, heading, reasons }) => {
  return (
    <Box css={{ position: "relative" }}>
      <Guides backgroundColor={backgroundColor} />
      <Box css={{ position: "relative", py: 120 }}>
        <Container size="3" css={{ p: 0, width: "100%" }}>
          <Flex align="center" css={{ width: "100%", mb: "$8" }}>
            <Flex direction="column" css={{ px: "$4" }}>
              <Text
                variant="violet"
                size="5"
                css={{ fontWeight: 600, mb: "$4" }}>
                {title}
              </Text>
              <Heading
                size="3"
                css={{
                  maxWidth: 600,
                  lineHeight: 1.4,
                  fontWeight: 700,
                  mb: "$6",
                  "@bp2": { lineHeight: 1.4, letterSpacing: "-1px" },
                }}>
                {heading}
              </Heading>
            </Flex>
            <Link href="/register" passHref>
              <Button arrow as="a" size="4">
                Sign up for free
              </Button>
            </Link>
          </Flex>
          <Box
            css={{
              display: "grid",
              grid: "1fr/repeat(2,1fr)",
              position: "relative",
              height: "100%",
              "@bp2": {
                grid: "1fr/repeat(4,1fr)",
              },
            }}>
            {reasons.map((reason, i) => (
              <Box key={i} css={{ pl: "$4", pr: "$6", width: "100%" }}>
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
                    jc: "center",
                    background:
                      "linear-gradient(90deg, rgba(107, 87, 214, 0.1) 0%, rgba(183, 167, 245, 0.1) 100%)",
                  }}>
                  {reason.icon}
                </Box>
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
                  {reason.title}
                </Text>
                <Text variant="gray" css={{ lineHeight: 1.6 }}>
                  {reason.description}
                </Text>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Why;
