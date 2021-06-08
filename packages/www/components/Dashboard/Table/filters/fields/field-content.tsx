import {
  Box,
  DropdownMenuContent,
  DropdownMenuItem,
  Flex,
  Text,
  TextField,
  styled,
} from "@livepeer.com/design-system";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SelectIcon, NextIcon, CalendarIcon } from "../helpers";
import { useState } from "react";
import { FilterType } from "./new";
import { ConditionType, ConditionValue } from "..";

const StyledDropdownTrigger = styled(DropdownMenu.Trigger, {
  width: "100%",
  height: "26px",
  padding: "0px 11px",
  borderRadius: "4px",
  boxShadow: "inset 0 0 0 1px $colors$slate7",
  margin: "0px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "$loContrast",
  border: "none",
  outline: "none",
  "&:focus": {
    boxShadow:
      "inset 0px 0px 0px 1px $colors$violet8, 0px 0px 0px 1px $colors$violet8",
    "&:-webkit-autofill": {
      boxShadow:
        "inset 0px 0px 0px 1px $colors$violet8, 0px 0px 0px 1px $colors$violet8, inset 0 0 0 100px $colors$violet3",
    },
  },
});

type Option = {
  label: string;
  value: ConditionType;
};

const options: Record<FilterType, Option[]> = {
  text: [
    { label: "contains", value: "contains" },
    { label: "is equal to", value: "dateEqual" },
  ],
  boolean: [{ label: "contains", value: "contains" }],
  date: [
    { label: "is equal to", value: "dateEqual" },
    { label: "is between", value: "contains" },
  ],
  number: [
    { label: "is between", value: "contains" },
    { label: "is equal to", value: "dateEqual" },
  ],
};

type ConditionSelectProps = {
  type: FilterType;
  selectedCondition: Option;
  onSelect: (option: Option) => void;
};

const ConditionSelect = ({
  type,
  selectedCondition,
  onSelect,
}: ConditionSelectProps) => {
  return (
    <DropdownMenu.Root>
      <Box>
        <StyledDropdownTrigger>
          <Text css={{ cursor: "default" }} size="2">
            {selectedCondition.label}
          </Text>
          <Flex>
            <SelectIcon />
          </Flex>
        </StyledDropdownTrigger>
        <DropdownMenuContent align="start" sideOffset={8} alignOffset={-10}>
          {options[type]
            .filter((a) => a.value !== selectedCondition.value)
            .map((option, i) => {
              // const isSelected = selectedCondition.value === option.value;
              return (
                <DropdownMenuItem
                  key={i}
                  onSelect={() => onSelect(option)}
                  css={{ padding: "0px 0px 0px 11px" }}>
                  <Box>
                    <Text size="2">{option.label}</Text>
                  </Box>
                </DropdownMenuItem>
              );
            })}
        </DropdownMenuContent>
      </Box>
    </DropdownMenu.Root>
  );
};

type ConditionValueProps = {
  selectedCondition: Option;
  type: FilterType;
  label: string;
  onChange: (newValue: ConditionValue) => void;
};

const ConditionValue = ({
  type,
  label,
  selectedCondition,
  onChange,
}: ConditionValueProps) => {
  switch (selectedCondition.value) {
    case "contains":
      return (
        // @ts-ignore
        <TextField
          id={label}
          onChange={(e) => onChange(e.target.value)}
          css={{
            height: "100%",
            width: "100%",
            padding: type === "date" ? "0px 11px 0px 32px" : "0px 11px",
            position: "absolute",
            maxWidth: type === "date" ? "100px" : "",
            left: 0,
            top: 0,
          }}
        />
      );
    case "dateEqual":
      return (
        <>
          <Box css={{ zIndex: 1, marginLeft: "10px", display: "flex" }}>
            <CalendarIcon />
          </Box>
          {/* TODO date field */}
          {/* @ts-ignore */}
          <TextField
            id={label}
            css={{
              height: "100%",
              width: "100%",
              padding: type === "date" ? "0px 11px 0px 32px" : "0px 11px",
              position: "absolute",
              maxWidth: type === "date" ? "100px" : "",
              left: 0,
              top: 0,
            }}
          />
        </>
      );

    default:
      return null;
  }
};

type FieldContentProps = {
  label: string;
  type: FilterType;
};

const FieldContent = ({ label, type }: FieldContentProps) => {
  const [selectedCondition, setSelectedCondition] = useState<Option>(
    options[type][0]
  );
  const [conditionValue, setConditionValue] = useState<any>();

  return (
    <>
      <ConditionSelect
        type={type}
        selectedCondition={selectedCondition}
        onSelect={setSelectedCondition}
      />
      <Flex
        as="label"
        htmlFor={label}
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
          <ConditionValue
            type={type}
            label={label}
            selectedCondition={selectedCondition}
          />
        </Box>
      </Flex>
    </>
  );
};

export default FieldContent;
