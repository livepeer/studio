import { Flex, Button, Link as A } from "@livepeer/design-system";

const Nav = () => {
  return (
    <Flex
      align="center"
      justify="between"
      css={{
        backgroundImage: "url(/noise.png)",
        backgroundRepeat: "repeat",
        bc: "#1C1C1C",
        height: 70,
        width: "100%",
        px: "$4",
        borderBottom: "1px solid rgba(255,255,255,.05)",
      }}>
      <A href="/">
        <img src="/logo.svg" />
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
