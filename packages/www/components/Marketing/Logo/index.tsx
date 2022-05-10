import Link from "next/link";
import { Box, Badge, Flex, Link as A } from "@livepeer/design-system";

const Logo = ({ badge = null }) => (
  <Flex align="center">
    <Link href="/" passHref>
      <A
        css={{
          textDecoration: "none",
          color: "$hiContrast",
          cursor: "pointer",
          letterSpacing: "-.3px",
          fontSize: "16px",
          fontWeight: 700,
          "&:hover": {
            textDecoration: "none",
          },
          "@bp3": {
            fontSize: "20px",
          },
        }}>
        Livepeer Video Services
      </A>
    </Link>
    {badge && (
      <Badge variant="primary" css={{ fontWeight: 700, ml: "$2", mt: "2px" }}>
        {badge}
      </Badge>
    )}
  </Flex>
);

export default Logo;
