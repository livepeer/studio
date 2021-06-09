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
import { useCallback, useMemo } from "react";
import { FilterType } from "./new";
import { ConditionType, Condition } from "..";

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
    { label: "is equal to", value: "textEqual" },
    { label: "contains", value: "contains" },
  ],
  date: [{ label: "is equal to", value: "dateEqual" }],
  number: [{ label: "is equal to", value: "textEqual" }],
  boolean: [{ label: "is true", value: "boolean" }],
};

type ConditionSelectProps = {
  type: FilterType;
  condition: Condition;
  onSelect: (conditionType: ConditionType) => void;
};

const ConditionSelect = ({
  type,
  condition,
  onSelect,
}: ConditionSelectProps) => {
  const { selectedOption, restOptions } = useMemo(() => {
    let selectedOption: Option | undefined = undefined;
    const restOptions: Option[] = [];
    options[type].forEach((option) => {
      if (option.value === condition.type) selectedOption = option;
      else restOptions.push(option);
    });

    return { selectedOption, restOptions };
  }, [type, condition.type]);

  return (
    <DropdownMenu.Root>
      <Box>
        <StyledDropdownTrigger>
          <Text css={{ cursor: "default" }} size="2">
            {selectedOption.label}
          </Text>
          <Flex>
            <SelectIcon />
          </Flex>
        </StyledDropdownTrigger>
        <DropdownMenuContent align="start" sideOffset={8} alignOffset={-10}>
          {restOptions.map((option, i) => {
            // const isSelected = selectedOption.value === option.value;
            return (
              <DropdownMenuItem
                key={i}
                onSelect={() => onSelect(option.value)}
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
  type: FilterType;
  label: string;
  condition: Condition;
  onChange: (newCondition: Condition) => void;
};

const ConditionValue = ({
  type,
  label,
  condition,
  onChange,
}: ConditionValueProps) => {
  switch (condition.type) {
    case "contains":
    case "textEqual":
      return (
        // @ts-ignore
        <TextField
          id={label}
          onChange={(e) =>
            onChange({ type: condition.type, value: e.target.value })
          }
          value={condition.value}
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
  condition: Condition;
  onConditionChange: (condition: Condition) => void;
};

const FieldContent = ({
  label,
  type,
  condition,
  onConditionChange,
}: FieldContentProps) => {
  const handleSelect = useCallback((conditionType: ConditionType) => {
    switch (conditionType) {
      case "contains":
        onConditionChange({ type: conditionType, value: "" });
        break;
      case "textEqual":
        onConditionChange({ type: conditionType, value: "" });
        break;
      case "dateEqual":
        onConditionChange({ type: conditionType, value: new Date() });
        break;
      default:
        break;
    }
  }, []);

  const handleChange = useCallback((condition: Condition) => {
    onConditionChange(condition);
  }, []);

  return (
    <>
      <ConditionSelect
        type={type}
        condition={condition}
        onSelect={handleSelect}
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
            condition={condition}
            onChange={handleChange}
          />
        </Box>
      </Flex>
    </>
  );
};

export default FieldContent;
