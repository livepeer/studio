import { Box, Flex, Text } from "@livepeer/design-system";
import { styled } from "@stitches/react";
import { cn } from "lib/cn";
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
      className={cn(
        "px-3 py-2 border border-accent rounded-md hover:bg-accent-foreground/10",
        isActive && "border-primary",
      )}
      onClick={handleClick}>
      <Text
        css={{
          fontSize: "$3",
          fontWeight: isActive ? 500 : 400,
          color: "inherit",
        }}>
        {name}
      </Text>
      <h4>{value}</h4>
    </Box>
  );
}
