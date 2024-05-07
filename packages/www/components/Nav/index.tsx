import { Flex, Button, Link as A } from "@livepeer/design-system";
import { basePath } from "../../lib/utils";

const Nav = () => {
  return (
    <Flex
      align="center"
      justify="between"
      css={{
        backgroundImage: `url(${basePath}/noise.png)`,
        backgroundRepeat: "repeat",
        bc: "#1C1C1C",
        height: 70,
        width: "100%",
        px: "$4",
        pt: "4px",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        "&:before": {
          position: "absolute",
          content: '""',
          width: "100%",
          height: "4px",
          left: 0,
          top: 0,
          background:
            "linear-gradient(90deg, #DC3D42 0%, #F0C000 45.83%, #299764 70%, #3A5CCC 99.48%), #D9D9D9",
        },
      }}>
      <A href="/" css={{ display: "flex" }}>
        <img src={`${basePath}/logo.svg`} />
      </A>
      <Button
        as={A}
        href="https://docs.livepeer.org"
        target="_blank"
        size={3}
        css={{
          bc: "#F8F8F8",
          color: "black",
          borderRadius: 1000,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
          textTransform: "uppercase",
          "&:hover": {
            bc: "rgba(255, 255, 255, .8)",
            transition: ".2s",
            color: "black",
            textDecoration: "none",
          },
        }}>
        Documentation
      </Button>
    </Flex>
  );
};

export default Nav;
