import { Flex, Box } from "@livepeer/design-system";

export type ItemProps = {
  key: string;
  mainChildren: React.ReactNode;
  secondaryChildren: React.ReactNode;
  accessoryChildren: React.ReactNode;
};

const Item = ({
  key,
  mainChildren,
  secondaryChildren,
  accessoryChildren,
}: ItemProps) => {
  return (
    <Flex
      key={key}
      align="center"
      css={{
        my: "$2",
        width: "100%",
        justifyContent: "space-between",
      }}>
      {mainChildren}
      <Flex align="center">
        <Box css={{ mr: "$3" }}>{secondaryChildren}</Box>
        {accessoryChildren}
      </Flex>
    </Flex>
  );
};

export default Item;
