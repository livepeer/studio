import {
  Box,
  Flex,
  Heading,
  Text,
  Container,
  Button,
} from "@livepeer/design-system";
import { FiArrowUpRight } from "react-icons/fi";
import Link from "next/link";

const CompareHero = ({
  title = "Compare Livepeer Studio",
  comparison = null,
}: any) => {
  return (
    <Box>
      <Container css={{ p: 0 }}>
        <Flex
          css={{
            pb: 0,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 120,
          }}>
          <Box>
            <Heading
              size="4"
              as="h1"
              css={{
                mb: "$5",
                fontWeight: 700,
              }}>
              {title}
            </Heading>
            <Text
              variant="neutral"
              size={6}
              css={{
                mb: "$6",
              }}>
              Livepeer Studio is a new approach to video infrastructure. Learn
              how its features and pricing compare to {comparison}.
            </Text>
            <Flex align="center" gap={1}>
              <Link href="/register" passHref>
                <Button
                  target="_blank"
                  size={3}
                  as="a"
                  css={{ mr: "$2", gap: "$2" }}
                  variant="green">
                  Get Started
                  <FiArrowUpRight />
                </Button>
              </Link>

              <Link
                href="https://livepeer.typeform.com/to/HTuUHdDR#lead_source=Website%20-%20Contact%20an%20Expert&contact_owner=xxxxx"
                passHref>
                <Button
                  target="_blank"
                  size={3}
                  as="a"
                  css={{ mr: "$2", gap: "$2" }}>
                  Talk to a Livepeer expert
                  <FiArrowUpRight />
                </Button>
              </Link>
            </Flex>
          </Box>
          <Box
            css={{
              display: "none",
              "@bp2": {
                display: "block",
              },
            }}>
            <img width="500" src="/img/heros/compare.png" />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default CompareHero;
