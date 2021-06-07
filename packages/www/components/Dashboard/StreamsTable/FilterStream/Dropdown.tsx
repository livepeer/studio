import { Box, Flex, Text } from "@livepeer.com/design-system";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SelectIcon } from "./Helpers";
import { useState } from "react";

type DropdownProps = {
  root: {
    name: string;
    options: string[];
    field: string;
  };
  setSelectedFilters: React.Dispatch<
    React.SetStateAction<
      {
        name: string;
        current: string;
      }[]
    >
  >;
};

const DropdownFilter = ({ root, setSelectedFilters }: DropdownProps) => {
  const [currentState, setCurrentState] = useState(root.options[0]);
  return (
    <DropdownMenu.Root>
      <Box
        css={{
          width: "100%",
          height: "26px",
          padding: "0px 11px",
          borderRadius: "4px",
          boxShadow: "inset 0 0 0 1px $colors$slate7",
          margin: "0px",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          background: "$loContrast",
        }}>
        <DropdownMenu.Trigger as="div">
          <Flex
            css={{
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <Text
              size="2"
              // @ts-ignore
              css={{ fontWeight: "500" }}>
              {currentState}
            </Text>
            <Flex>
              <SelectIcon />
            </Flex>
          </Flex>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" sideOffset={8} alignOffset={-10}>
          {root.options
            .filter((a) => a !== currentState)
            .map((option, idx) => (
              <DropdownMenu.Item
                // onSelect={() => setSelectedFilters((prev) => ({ ...prev }))}
                key={idx}>
                <Box
                  css={{
                    width: "100%",
                    height: "26px",
                    padding: "0px 11px",
                    borderRadius: "4px",
                    boxShadow: "inset 0 0 0 1px $colors$slate7",
                    margin: "0px",
                    display: "flex",
                    alignItems: "center",
                    background: "$loContrast",
                  }}>
                  <Text
                    size="2"
                    // @ts-ignore
                    css={{ fontWeight: "500" }}>
                    {option}
                  </Text>
                </Box>
              </DropdownMenu.Item>
            ))}
        </DropdownMenu.Content>
      </Box>
    </DropdownMenu.Root>
  );
};

export default DropdownFilter;
