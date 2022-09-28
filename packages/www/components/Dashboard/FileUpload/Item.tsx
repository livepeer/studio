import { Flex, Box } from "@livepeer/design-system";

export type ItemProps = {
  itemKey: string;
  mainChildren: React.ReactNode;
  secondaryChildren: React.ReactNode;
  accessoryChildren: React.ReactNode;
};

const Item = ({
  itemKey,
  mainChildren,
  secondaryChildren,
  accessoryChildren,
}: ItemProps) => {
  return (
    <Flex
      key={itemKey}
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
