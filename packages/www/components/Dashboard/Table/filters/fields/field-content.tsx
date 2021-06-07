import {
  Box,
  DropdownMenuContent,
  DropdownMenuItem,
  Flex,
  Text,
  TextField,
} from "@livepeer.com/design-system";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SelectIcon, NextIcon } from "../helpers";
import { useState } from "react";
import { FilterType } from "./new";

type ParameterValue = "contains" | "between";

type Option = {
  label: string;
  value: ParameterValue;
};

const options: Record<FilterType, Option[]> = {
  text: [
    { label: "contains", value: "contains" },
    { label: "between", value: "between" },
  ],
  boolean: [{ label: "contains", value: "contains" }],
  date: [{ label: "contains", value: "contains" }],
  number: [{ label: "contains", value: "contains" }],
};

type ParameterSelectProps = {
  type: FilterType;
};

const ParameterSelect = ({ type }: ParameterSelectProps) => {
  const [selected, setSelected] = useState<Option>(options[type][0]);

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
            <Text size="2">{selected.label}</Text>
            <Flex>
              <SelectIcon />
            </Flex>
          </Flex>
        </DropdownMenu.Trigger>
        <DropdownMenuContent align="start" sideOffset={8} alignOffset={-10}>
          {options[type]
            .filter((a) => a.value !== selected.value)
            .map((option, i) => {
              // const isSelected = selected.value === option.value;
              const onSelect = () => setSelected(option);
              switch (option.value) {
                case "contains":
                  return (
                    <DropdownMenuItem
                      key={i}
                      onSelect={onSelect}
                      css={{ padding: "0px 0px 0px 11px" }}>
                      <Box
                        css={
                          {
                            // width: "100%",
                            // height: "26px",
                            // padding: "0px 11px",
                            // borderRadius: "4px",
                            // boxShadow: "inset 0 0 0 1px $colors$slate7",
                            // margin: "0px",
                            // display: "flex",
                            // alignItems: "center",
                            // background: "$loContrast",
                          }
                        }>
                        <Text size="2">{option.label}</Text>
                      </Box>
                    </DropdownMenuItem>
                  );
                case "between":
                  return (
                    <DropdownMenuItem
                      key={i}
                      onSelect={onSelect}
                      css={{ padding: "0px 0px 0px 11px" }}>
                      <Box
                        css={
                          {
                            // width: "100%",
                            // height: "26px",
                            // padding: "0px 11px",
                            // borderRadius: "4px",
                            // boxShadow: "inset 0 0 0 1px $colors$slate7",
                            // margin: "0px",
                            // display: "flex",
                            // alignItems: "center",
                            // background: "$loContrast",
                          }
                        }>
                        {option.label}
                        {/* <Text size="2">{option.label}</Text> */}
                      </Box>
                    </DropdownMenuItem>
                  );

                default:
                  return null;
              }
            })}
        </DropdownMenuContent>
      </Box>
    </DropdownMenu.Root>
  );
};

type FieldContentProps = {
  label: string;
  type: FilterType;
};

const FieldContent = ({ label, type }: FieldContentProps) => {
  return (
    <>
      <ParameterSelect type={type} />
      <Flex
        css={{
          alignItems: "center",
          marginTop: "10px",
        }}>
        <Flex>
          <NextIcon />
        </Flex>
        <Box
          css={{
            width: "100%",
            maxWidth: "100%",
            height: "26px",
            borderRadius: "4px",
            position: "relative",
            margin: "0px 0px 0px 11px",
            display: "flex",
            alignItems: "center",
            background: "$loContrast",
          }}>
          {/* @ts-ignore */}
          <TextField
            id={label}
            css={{
              height: "100%",
              width: "100%",
              padding: "0px 11px",
              position: "absolute",
              left: 0,
              top: 0,
            }}
          />
        </Box>
      </Flex>
    </>
  );
};

export default FieldContent;
