/** @jsx jsx */
import { jsx } from "theme-ui";
import { Box, Flex, Input } from "@theme-ui/components";
import Checkbox from "components/Admin/Checkbox";
import { useCallback } from "react";

type AnyFilterValue = string;

type BaseFilterProps<
  Table extends Record<string, unknown>,
  Value extends AnyFilterValue = string
> = {
  currentFilters: { id: keyof Table; value: Value }[] | undefined;
  setFilter: (columnId: keyof Table, newValue: Value) => void;
};

export type InputFilterProps<Table extends Record<string, unknown>> = {
  placeholder: string;
  columnId: keyof Table;
};

const TextFilter = <Table extends Record<string, unknown>>({
  currentFilters,
  setFilter,
  placeholder,
  columnId,
}: BaseFilterProps<Table> & InputFilterProps<Table>) => {
  const value = currentFilters?.find((f) => f.id === columnId)?.value ?? "";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilter(columnId, e.target.value);
    },
    [setFilter]
  );

  return (
    <Input
      sx={{ width: "100%", maxWidth: "300px" }}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
};

export type CheckboxFilterProps<Table extends Record<string, unknown>> = {
  columnId: keyof Table;
  label: string;
  valueIfTrue: string;
  valueIfFalse: string;
};

const CheckboxFilter = <Table extends Record<string, unknown>>({
  currentFilters,
  setFilter,
  label,
  columnId,
  valueIfTrue,
  valueIfFalse,
}: BaseFilterProps<Table> & CheckboxFilterProps<Table>) => {
  const value = currentFilters?.find((f) => f.id === columnId)?.value ?? false;

  const handleClick = useCallback(() => {
    setFilter(columnId, value === valueIfTrue ? valueIfFalse : valueIfTrue);
  }, [value, columnId, setFilter, valueIfTrue, valueIfFalse]);

  return (
    <Flex
      sx={{ display: "inline-flex", alignItems: "baseline" }}
      onClick={handleClick}>
      <Checkbox value={value === valueIfTrue} onClick={() => undefined} />
      <Box sx={{ ml: "0.5rem", userSelect: "none", cursor: "default" }}>
        {label}
      </Box>
    </Flex>
  );
};

export { TextFilter, CheckboxFilter };
