import { Box, Flex, TextField, styled } from "@livepeer.com/design-system";
import { SelectIcon, NextIcon, CalendarIcon } from "../helpers";
import { useCallback, useMemo, useState } from "react";
import { FilterType } from "./new";
import { ConditionType, Condition } from "..";

const Select = styled("select", {
  WebkitAppearance: "none",
  width: "100%",
  height: "100%",
  position: "absolute",
  left: 0,
  top: 0,
  padding: "0px 11px",
  fontSize: "12px",
  lineHeight: "1",
  borderRadius: "4px",
  background: "$loContrast",
  border: "none",
  outline: "none",
  boxShadow: "inset 0 0 0 1px $colors$slate7",
  "&:focus": {
    border: "none",
    outline: "none",
    boxShadow:
      "inset 0px 0px 0px 1px $colors$violet8, 0px 0px 0px 1px $colors$violet8",
    "&:-webkit-autofill": {
      boxShadow:
        "inset 0px 0px 0px 1px $colors$violet8, 0px 0px 0px 1px $colors$violet8, inset 0 0 0 100px $colors$violet3",
    },
  },
});

const DateInput = styled("input", {
  WebkitAppearance: "none",
  height: "100%",
  maxWidth: "88px",
  position: "absolute",
  paddingLeft: "30px",
  fontSize: "12px",
  fontFamily: "$untitled",
  left: 0,
  top: 0,
  borderRadius: "4px",
  background: "$loContrast",
  border: "none",
  outline: "none",
  boxShadow: "inset 0 0 0 1px $colors$slate7",
  "&::-webkit-calendar-picker-indicator": {
    position: "absolute",
    left: -18,
    zIndex: 1,
    opacity: "0",
  },
  "&:focus": {
    border: "none",
    outline: "none",
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
  date: [
    { label: "is equal to", value: "dateEqual" },
    { label: "is between", value: "dateBetween" },
  ],
  number: [
    { label: "is equal to", value: "numberEqual" },
    { label: "is between", value: "numberBetween" },
  ],
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
      restOptions.push(option);
    });

    return { selectedOption, restOptions };
  }, [type, condition.type]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    const selectedOption = restOptions.filter((o) => o.label === value)[0];
    onSelect(selectedOption.value);
  }, []);

  console.log(restOptions);

  return (
    <Box
      css={{
        height: "26px",
        width: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        margin: "0px",
        background: "$loContrast",
      }}>
      <Select onChange={handleChange}>
        {restOptions.map((option, i) => {
          // const isSelected = selectedOption.value === option.value;
          return (
            <option value={option.label} key={i}>
              {option.label}
            </option>
          );
        })}
      </Select>
      <Flex css={{ zIndex: 1, marginRight: "11px" }}>
        <SelectIcon />
      </Flex>
    </Box>
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
  const [dateBetweenFirstValue, setDateBetweenFirstValue] = useState(
    new Date().toString()
  );
  const [dateBetweenSecondValue, setDateBetweenSecondValue] = useState(
    new Date().toString()
  );
  const [numberBetweenFirstValue, setNumberBetweenFirstValue] = useState(0);
  const [numberBetweenSecondValue, setNumberBetweenSecondValue] = useState(0);
  switch (condition.type) {
    case "contains":
      return (
        <Box
          as="label"
          htmlFor={label}
          css={{
            height: "26px",
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          {/* @ts-ignore */}
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
        </Box>
      );
    case "textEqual":
      return (
        <Box
          as="label"
          htmlFor={label}
          css={{
            height: "26px",
            width: "100%",
            maxWidth: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          {/* @ts-ignore */}
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
        </Box>
      );
    case "dateEqual":
      return (
        <Box
          as="label"
          htmlFor={label}
          css={{
            height: "26px",
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          <Box css={{ zIndex: 1, marginLeft: "10px", display: "flex" }}>
            <CalendarIcon />
          </Box>
          {/* @ts-ignore */}
          <DateInput
            type="date"
            id={label}
            onChange={(e) =>
              onChange({ type: condition.type, value: e.target.value })
            }
          />
        </Box>
      );
    case "dateBetween":
      return (
        <div
          style={{
            marginTop: "",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}>
          <Box
            as="label"
            htmlFor={label}
            css={{
              height: "26px",
              width: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            <Box css={{ zIndex: 1, marginLeft: "10px", display: "flex" }}>
              <CalendarIcon />
            </Box>
            {/* @ts-ignore */}
            <DateInput
              type="date"
              id={label}
              onChange={(e) => {
                const value = e.target.value;
                setDateBetweenFirstValue(value);
                onChange({
                  type: condition.type,
                  value: { first: value, second: dateBetweenSecondValue },
                });
              }}
            />
          </Box>
          <Box
            as="label"
            htmlFor={label}
            css={{
              height: "26px",
              width: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            <Box css={{ zIndex: 1, marginLeft: "10px", display: "flex" }}>
              <CalendarIcon />
            </Box>
            {/* @ts-ignore */}
            <DateInput
              type="date"
              id={label}
              onChange={(e) => {
                const value = e.target.value;
                setDateBetweenSecondValue(value);
                onChange({
                  type: condition.type,
                  value: { first: dateBetweenFirstValue, second: value },
                });
              }}
            />
          </Box>
        </div>
      );
    case "numberEqual":
      return (
        <Box
          as="label"
          htmlFor={label}
          css={{
            height: "26px",
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: "0px",
          }}>
          {/* @ts-ignore */}
          <TextField
            type="number"
            id={label}
            onChange={(e) =>
              onChange({
                type: condition.type,
                value: parseInt(e.target.value),
              })
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
        </Box>
      );
    case "numberBetween":
      return (
        <div
          style={{
            marginTop: "",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px",
          }}>
          <Box
            as="label"
            htmlFor={label}
            css={{
              height: "26px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            {/* @ts-ignore */}
            <TextField
              id={label}
              type="number"
              onChange={(e) => {
                const value = e.target.value;
                setNumberBetweenFirstValue(parseInt(value));
                onChange({
                  type: condition.type,
                  value: [parseInt(value), numberBetweenSecondValue],
                });
              }}
              value={numberBetweenFirstValue}
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
          </Box>
          <Box
            as="label"
            htmlFor={label}
            css={{
              height: "26px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              margin: "0px",
            }}>
            {/* @ts-ignore */}
            <TextField
              id={label}
              type="number"
              onChange={(e) => {
                const value = e.target.value;
                setNumberBetweenSecondValue(parseInt(value));
                onChange({
                  type: condition.type,
                  value: [numberBetweenFirstValue, parseInt(value)],
                });
              }}
              value={numberBetweenSecondValue}
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
          </Box>
        </div>
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
        onConditionChange({
          type: conditionType,
          value: new Date().toString(),
        });
        break;
      case "dateBetween":
        onConditionChange({
          type: conditionType,
          value: {
            first: new Date().toString(),
            second: new Date().toString(),
          },
        });
        break;
      case "numberEqual":
        onConditionChange({
          type: conditionType,
          value: 0,
        });
        break;
      case "numberBetween":
        onConditionChange({
          type: conditionType,
          value: {
            first: 0,
            second: 0,
          },
        });
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
          marginTop: "10px",
        }}>
        <Flex css={{ marginTop: "8px" }}>
          <NextIcon />
        </Flex>
        <Box
          css={{
            margin: "0px 0px 0px 11px",
            width: "100%",
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
