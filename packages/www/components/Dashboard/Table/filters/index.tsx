import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Box, Button, Flex, Text } from "@livepeer.com/design-system";
import { useCallback, useEffect, useState } from "react";
import { FilterIcon, StyledAccordion } from "./helpers";
import TableFilterTextField from "./fields/text";
import { FilterType } from "./fields/new";
import TableFilterDateField from "./fields/date";
import TableFilterNumberField from "./fields/number";
import { format } from "date-fns";

export type Condition =
  | { type: "contains"; value: string }
  | { type: "textEqual"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "dateEqual"; value: string }
  | { type: "dateBetween"; value: [string, string] }
  | { type: "numberEqual"; value: number }
  | { type: "numberBetween"; value: [number, number] };
export type ConditionType = Condition["type"];
export type ConditionValue = Condition["value"];

type Filter = FilterItem &
  (
    | {
        isOpen: true;
        condition: Condition;
      }
    | { isOpen: false }
  );

export type FilterItem = {
  label: string;
  type: FilterType;
};

type TableFilterProps = {
  items: FilterItem[];
  onFiltersChange: (filters: Filter[]) => void;
};

const TableFilter = ({ items, onFiltersChange }: TableFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>(
    items.map((i) => ({ ...i, isOpen: false }))
  );

  const handleClear = useCallback(() => {
    setFilters((p) =>
      p.map((f) => ({ label: f.label, type: f.type, isOpen: false }))
    );
  }, []);

  const handleDone = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

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
            width: "284px",
            maxWidth: "284px",
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
          <StyledAccordion
            type="multiple"
            value={filters.map((f) => (f.isOpen ? f.label : undefined))}>
            {filters.map((filter, i) => {
              const onToggleOpen = () => {
                setFilters((p) => {
                  const newFilters: Filter[] = [
                    ...p.map((f) => {
                      if (filter.label !== f.label) return f;
                      if (f.isOpen) {
                        return {
                          isOpen: false as false,
                          label: f.label,
                          type: f.type,
                        };
                      } else {
                        let defaultCondition: Condition;
                        switch (f.type) {
                          case "text":
                            defaultCondition = { type: "contains", value: "" };
                            break;
                          case "date":
                            defaultCondition = {
                              type: "dateEqual",
                              value: format(new Date(), "yyyy-MM-dd"),
                            };
                            break;
                          case "number":
                            defaultCondition = {
                              type: "numberEqual",
                              value: 0,
                            };
                            break;
                          default:
                            break;
                        }

                        return {
                          isOpen: true as true,
                          label: f.label,
                          type: f.type,
                          condition: defaultCondition,
                        };
                      }
                    }),
                  ];
                  return newFilters;
                });
              };

              const onConditionChange = (condition: Condition) => {
                setFilters((p) => {
                  const newFilters: Filter[] = [
                    ...p.map((f) => {
                      if (filter.label !== f.label) return f;
                      return {
                        isOpen: true,
                        label: f.label,
                        type: f.type,
                        condition: condition,
                      };
                    }),
                  ];
                  return newFilters;
                });
              };

              switch (filter.type) {
                case "text":
                  return (
                    <TableFilterTextField
                      label={filter.label}
                      key={i}
                      isOpen={filter.isOpen}
                      onToggleOpen={onToggleOpen}
                      condition={filter.isOpen ? filter.condition : null}
                      onConditionChange={onConditionChange}
                    />
                  );
                case "date":
                  return (
                    <TableFilterDateField
                      label={filter.label}
                      key={i}
                      isOpen={filter.isOpen}
                      onToggleOpen={onToggleOpen}
                      condition={filter.isOpen ? filter.condition : null}
                      onConditionChange={onConditionChange}
                    />
                  );
                case "number":
                  return (
                    <TableFilterNumberField
                      label={filter.label}
                      key={i}
                      isOpen={filter.isOpen}
                      onToggleOpen={onToggleOpen}
                      condition={filter.isOpen ? filter.condition : null}
                      onConditionChange={onConditionChange}
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
