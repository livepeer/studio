import Link from "next/link";
import { Link as A } from "@livepeer.com/design-system";

const Logo = () => (
  <Link href="/" passHref>
    <A
      css={{
        textDecoration: "none",
        color: "$hiContrast",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        letterSpacing: "-.3px",
        fontSize: "21px",
        fontWeight: 700,
        "&:hover": {
          textDecoration: "none",
        },
      }}>
      Livepeer.com
    </A>
  </Link>
);

export default Logo;
