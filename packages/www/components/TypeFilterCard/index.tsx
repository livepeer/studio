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
        border: "1px solid",
        borderColor: isActive ? "$primary8" : "$neutral8",
        borderRadius: "$3",
        cursor: "default",
        "&:hover": {
          border: "1px solid",
          borderColor: "$primary8",
          transition: "0.3s",
        },
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
        }}>
        {value}
      </Text>
    </Box>
  );
}
