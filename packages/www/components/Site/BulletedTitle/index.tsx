import { Box, Flex } from "@livepeer/design-system";

const BulletedTitle = ({ children, css }) => (
  <Flex
    align="center"
    css={{ fontSize: "$4", textTransform: "uppercase", ...css }}>
    <Box
      css={{
        mr: "$2",
        borderRadius: 1000,
        width: 14,
        height: 14,
        bc: "currentColor",
      }}
    />
    <Box color="currentColor">{children}</Box>
  </Flex>
);

export default BulletedTitle;
