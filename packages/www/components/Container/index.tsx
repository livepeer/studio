/** @jsx jsx */
import { jsx } from "theme-ui";
import { Flex, Container } from "@theme-ui/components";

export default ({ children }) => {
  return (
    <Flex sx={{ flexDirection: "column", alignItems: "center" }}>
      <Container>{children}</Container>
    </Flex>
  );
};
