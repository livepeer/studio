import Link from "next/link";
import { Box, Badge, Flex, Link as A } from "@livepeer.com/design-system";

const Logo = ({ badge = null }) => (
  <Flex align="center">
    <Link href="/" passHref>
      <A
        css={{
          textDecoration: "none",
          color: "$hiContrast",
          cursor: "pointer",
          letterSpacing: "-.3px",
          fontSize: "21px",
          fontWeight: 700,
          "&:hover": {
            textDecoration: "none",
          },
        }}>
        Livepeer Video Services
      </A>
    </Link>
    {badge && (
      <Badge variant="violet" css={{ fontWeight: 700, ml: "$2", mt: "2px" }}>
        {badge}
      </Badge>
    )}
  </Flex>
);

export default Logo;
