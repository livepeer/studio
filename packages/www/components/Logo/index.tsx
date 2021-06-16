/** @jsx jsx */
import { jsx } from "theme-ui";
import Link from "next/link";
import LogoSvg from "../../public/img/logo.svg";
import { Flex, Link as A } from "@theme-ui/components";

type Props = {
  logoType?: boolean;
  isDark?: boolean;
  withoutBeta?: boolean;
};

const Logo = ({ logoType = true, isDark, withoutBeta }: Props) => (
  <Link href="/" passHref>
    <A
      sx={{
        textDecoration: "none",
        color: isDark ? "background" : "text",
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        letterSpacing: "-.5px",
        ":hover": {
          textDecoration: "none",
        },
      }}>
      {logoType && (
        <Flex
          sx={{
            alignItems: "center",
            fontWeight: 700,
            fontSize: "22px",
          }}>
          Livepeer.com
        </Flex>
      )}
      {!withoutBeta && (
        <span
          sx={{
            mt: "2px",
            ml: logoType ? "6px" : "10px",
            fontWeight: 700,
            letterSpacing: 0,
            fontSize: "10px",
            borderRadius: 1000,
            px: 2,
            py: "2px",
            bg: "rgb(148, 60, 255, .1)",
          }}>
          beta
        </span>
      )}
    </A>
  </Link>
);

export default Logo;
