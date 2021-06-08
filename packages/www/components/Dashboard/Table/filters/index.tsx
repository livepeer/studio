import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Box, Button, Flex, Text } from "@livepeer.com/design-system";
import { useCallback, useState } from "react";
import { FilterIcon, StyledAccordion } from "./helpers";
import TableFilterTextField from "./fields/text";
import { FilterType } from "./fields/new";
import TableFilterDateField from "./fields/date";
import TableFilterNumberField from "./fields/number";

type FilterItem = {
  label: string;
  type: FilterType;
};

type TableFilterProps = {
  items: FilterItem[];
};

export type Condition =
  | { type: "contains"; value: string }
  | { type: "dateEqual"; value: Date };
export type ConditionType = Condition["type"];
export type ConditionValue = Condition["value"];

type ActiveFilter = { label: string } & (
  | {
      isOpen: true;
      condition: Condition;
    }
  | { isOpen: false }
);

const hola: ActiveFilter = {
  label: "hoal",
  isOpen: false,
};

const TableFilter = ({ items }: TableFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openFields, setOpenFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);

  const handleClear = useCallback(() => {
    setFilters((p) =>
      p.map((f) => ({ label: f.label, isOpen: false, condition: undefined }))
    );
  }, []);

  const handleDone = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger as="div">
        <Button
          css={{ display: "flex", ai: "center", marginRight: "6px" }}
          size="2"
          variant="gray">
          <Flex css={{ marginRight: "5px" }}>
            <FilterIcon />
          </Flex>
          Filter
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" sideOffset={5}>
        <Box
          css={{
            backgroundColor: "$loContrast",
            width: "241px",
            maxWidth: "241px",
            display: "flex",
            flexDirection: "column",
            marginRight: "6px",
            borderRadius: "4px",
            overflow: "hidden",
            boxShadow:
              "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
          }}>
          <Flex
            css={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 7px",
              background: "$panel",
            }}>
            <Button onClick={handleClear} size="1" variant="gray">
              Clear
            </Button>
            <Text size="2" css={{ margin: "0px" }}>
              Filters
            </Text>
            <Button size="1" variant="violet" onClick={handleDone}>
              Done
            </Button>
          </Flex>
          <StyledAccordion type="multiple" value={openFields}>
            {items.map((item, i) => {
              const onToggleOpen = () => {
                setFilters((p) =>
                  p.map((f) => {
                    if (f.isOpen) {
                      return { ...f, isOpen: false };
                    } else return { ...f, isOpen: true };
                  })
                );
              };

              switch (item.type) {
                case "text":
                  return (
                    <TableFilterTextField
                      label={item.label}
                      key={i}
                      isOpen={isOpen}
                      onToggleOpen={onToggleOpen}
                    />
                  );
                case "date":
                  return (
                    <TableFilterDateField
                      label={item.label}
                      key={i}
                      isOpen={isOpen}
                      onToggleOpen={onToggleOpen}
                    />
                  );
                case "number":
                  return (
                    <TableFilterNumberField
                      label={item.label}
                      key={i}
                      isOpen={isOpen}
                      onToggleOpen={onToggleOpen}
                    />
                  );
                default:
                  return null;
              }
            })}
          </StyledAccordion>
        </Box>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default TableFilter;
