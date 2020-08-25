import { Flex, Container, Box } from "@theme-ui/components";
import Link from "next/link";
import Logo from "../Logo";

const Footer = () => {
  return (
    <Box
      sx={{
        py: 4,
        bg: "text",
        color: "background",
        boxShadow: "0px 0px 60px rgba(0, 0, 0, 0.08)"
      }}
    >
      <Container>
        <Flex
          sx={{
            flexDirection: ["column", "column", "column", "row"],
            alignItems: "center",
            textAlign: ["center", "center", "center", "left"],
            justifyContent: "space-between"
          }}
        >
          <Logo isDark />
          <Flex
            sx={{
              justifyContent: "center",
              alignItems: "center",
              width: ["100%", "100%", "100%", "33.33%"],
              my: [3, 3, 3, 0],
              color: "white"
            }}
            itemScope
            itemType="http://schema.org/Organization"
          >
            <Flex
              itemProp="address"
              itemScope
              itemType="http://schema.org/PostalAddress"
            >
              <Box itemProp="streetAddress" sx={{ mr: 1 }}>
                16 Vestry St, Floor 4
              </Box>
              <Box itemProp="addressLocality" sx={{ mr: 1 }}>
                New York, NY
              </Box>
              <Box itemProp="postalCode">10013</Box>
            </Flex>
          </Flex>
          <Flex
            sx={{
              width: ["100%", "100%", "100%", "33.33%"],
              justifyContent: ["center", "center", "center", "flex-end"],
              alignItems: "center"
            }}
          >
            {/* <Link href="/blog" passHref>
              <a sx={{ textDecoration: "none", mr: 4, color: "accent" }}>
                Blog
              </a>
            </Link> */}
            <Link href="/[slug]" as="/team" passHref>
              <a sx={{ textDecoration: "none", mr: 4, color: "accent" }}>
                Team
              </a>
            </Link>
            <Link href="/[slug]" as="/jobs" passHref>
              <a sx={{ textDecoration: "none", mr: 4, color: "accent" }}>
                Jobs
              </a>
            </Link>
            <Link href="/[slug]" as="/privacy-policy" passHref>
              <a sx={{ textDecoration: "none", color: "accent" }}>
                Privacy Policy
              </a>
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;
