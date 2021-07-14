import Link from "next/link";
import { Badge, Box, Link as A } from "@livepeer.com/design-system";

type Props = {
  logoType?: boolean;
  isDark?: boolean;
  withoutBeta?: boolean;
};

const Logo = ({ logoType = true, withoutBeta }: Props) => (
  <Link href="/" passHref>
    <A
      css={{
        textDecoration: "none",
        color: "$hiContrast",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        letterSpacing: "-.2px",
        fontSize: "22px",
        fontWeight: 700,
        "&:hover": {
          textDecoration: "none",
        },
      }}>
      {logoType && "Livepeer.com"}
      {!withoutBeta && (
        <Badge
          variant="violet"
          css={{ ml: "$1", fontWeight: 700, mt: "5px", px: "$2" }}>
          beta
        </Badge>
      )}
    </A>
  </Link>
);

export default Logo;
