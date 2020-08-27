import Link from "next/link";
import LogoSvg from "../../public/img/logo.svg";
import { Link as A } from "@theme-ui/components";
import { Box } from "@theme-ui/components";

type Props = {
  logoType?: boolean;
  isDark?: boolean;
};

const Logo = ({ logoType = true, isDark }: Props) => (
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
          textDecoration: "none"
        }
      }}
    >
      <LogoSvg sx={{ color: isDark ? "background" : "text" }} />
      {logoType && (
        <Box
          sx={{
            ml: "12px",
            fontWeight: 800,
            fontSize: "22px"
          }}
        >
          Livepeer.com
        </Box>
      )}
    </A>
  </Link>
);

export default Logo;
