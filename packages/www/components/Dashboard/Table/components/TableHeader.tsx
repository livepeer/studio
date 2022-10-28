import { Box, Flex, Heading } from "@livepeer/design-system";

const TableHeader = ({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) => (
  <Heading size="2">
    <Flex>
      <Box css={{ mr: "$3", fontWeight: 600, letterSpacing: 0 }}>{title}</Box>
      {children}
    </Flex>
  </Heading>
);

export default TableHeader;
