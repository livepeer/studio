import { Box, Flex, Text } from "@livepeer/design-system";
import { styled } from "@stitches/react";
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
  const StyledDiv = styled("div", {
    paddingLeft: "$3",
    paddingTop: "$2",
    paddingBottom: "$2",
    width: "20em",
    border: "1px solid",
    borderColor: isActive ? "$primary8" : "$neutral8",
    borderRadius: "$3",
    color: isActive ? "$primary8" : "$neutral8",
    cursor: "default",
    "&:hover": {
      border: "1px solid",
      borderColor: "$primary8",
      color: "$primary8",
      transition: "0.3s",
    },
    "& h4": {
      color: isActive ? "$primary8" : "$primary12",
    },
    "&:hover h4": {
      color: "$primary8",
      transition: "0.3s",
    },
  });

  return (
    <StyledDiv onClick={handleClick}>
      <Text
        css={{
          fontSize: "$3",
          fontWeight: isActive ? 500 : 400,
          color: "inherit",
        }}>
        {name}
      </Text>
      <h4>{value}</h4>
    </StyledDiv>
  );
}
