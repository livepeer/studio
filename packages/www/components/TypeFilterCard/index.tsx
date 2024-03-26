import { Box, Flex, Text } from "@livepeer/design-system";
import React from "react";

export default function TypeFilterCard({
  handleClick,
  isActive,
  name,
  value,
}: {
  handleClick: () => void;
  isActive: boolean;
  name: string;
  value: string;
}) {
  return (
    <Box
      onClick={handleClick}
      css={{
        px: "$3",
        py: "$2",
        width: "20em",
        border: isActive ? "2px solid" : "1px solid",
        borderColor: isActive ? "$black" : "$neutral8",
        borderRadius: "$3",
      }}>
      <Text
        css={{
          fontSize: "$3",
          fontWeight: isActive ? 500 : 400,
          mb: "$1",
          color: "$neutral9",
          textTransform: "capitalize",
        }}>
        {name}
      </Text>
      <Text
        css={{
          fontWeight: 500,
          fontSize: "$3",
          color: isActive && "$black",
        }}>
        {value}
      </Text>
    </Box>
  );
}
