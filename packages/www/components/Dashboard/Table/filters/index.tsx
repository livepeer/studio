import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Box, Button, Flex, Text } from "@livepeer.com/design-system";
import { useCallback, useState, useEffect } from "react";
import { FilterIcon, StyledAccordion } from "./helpers";
import TableFilterTextField from "./fields/text";
import TableFilterDateField from "./fields/date";
import TableFilterNumberField from "./fields/number";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { makeQuery, QueryParams } from "@lib/utils/router";

export type FilterType = "text" | "number" | "boolean" | "date";

export type Condition =
  | { type: "contains"; value: string }
  // | { type: "textEqual"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "dateEqual"; value: string }
  | { type: "dateBetween"; value: [string, string] }
  | { type: "numberEqual"; value: number }
  | { type: "numberBetween"; value: [number, number] };
export type ConditionType = Condition["type"];
export type ConditionValue = Condition["value"];

export type Filter = FilterItem &
  (
    | {
        isOpen: true;
        condition: Condition;
      }
    | { isOpen: false }
  );

export type FilterItem = {
  label: string;
  id: string;
  type: FilterType;
};

export type ApplyFilterHandler = (filters: Filter[]) => void;

function getActiveFiltersCount(filters: Filter[]) {
  return filters.reduce((count, f) => {
    if (f.isOpen) return count + 1;
  }, 0);
}

type TableFilterProps = {
  items: FilterItem[];
  onDone: ApplyFilterHandler;
};

const TableFilter = ({ items, onDone }: TableFilterProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>(
    items.map((i) => ({ ...i, isOpen: false }))
  );
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleClear = useCallback(() => {
    setFilters((p) =>
      p.map((f) => ({ label: f.label, type: f.type, id: f.id, isOpen: false }))
    );
  }, []);

  const handleDone = useCallback(async () => {
    setIsOpen(false);
    onDone(filters);
    setActiveFiltersCount(getActiveFiltersCount(filters));
    const formatted = formatFiltersForApiRequest(filters);
    const queryParams: QueryParams = {};
    filters.forEach((filter) => {
      const formattedFilter = formatted.find((f) => f.id === filter.id);
      queryParams[filter.id] = formattedFilter?.value ?? null;
    });
    await makeQuery(router, queryParams);
  }, [filters, router]);

  // Initialize filters from queryParams
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const itemsFromQueryParams: Filter[] = items.map((item) => {
      const searchParamValue = searchParams.get(item.id);
      if (!searchParamValue) return { ...item, isOpen: false };
      return formatFilterItemFromQueryParam(item, searchParamValue);
    });
    onDone(itemsFromQueryParams);
    setFilters(itemsFromQueryParams);
    setActiveFiltersCount(getActiveFiltersCount(itemsFromQueryParams));
  }, [items]);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger
        as={Button}
        css={{ display: "flex", ai: "center", marginRight: "6px" }}
        size="2"
        variant="gray">
        <Flex css={{ marginRight: "5px" }}>
          <FilterIcon />
        </Flex>
        Filter
        {activeFiltersCount > 0 && (
          <>
            <Box
              as="span"
              css={{
                mx: "$2",
                height: "18px",
                width: "1px",
                background: "$blackA5",
              }}
            />
            <Box as="span" css={{ color: "$violet11" }}>
              {activeFiltersCount}
            </Box>
          </>
        )}
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
                          id: f.id,
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
                          id: f.id,
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
                        id: f.id,
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

export const formatFiltersForApiRequest = (filters: Filter[]) => {
  const normalized: { id: string; value: string }[] = [];
  filters.forEach((filter) => {
    if (!filter.isOpen) return;
    switch (filter.type) {
      case "text":
        normalized.push({
          id: filter.id,
          value: filter.condition.value.toString(),
        });
        break;
      case "boolean":
        normalized.push({
          id: filter.id,
          value: filter.condition.value.toString(),
        });
        break;
      default:
        break;
    }
  });
  return normalized;
};

export const formatFilterItemFromQueryParam = (
  filter: FilterItem,
  queryParamValue: string
): Filter => {
  switch (filter.type) {
    case "text":
      return {
        ...filter,
        isOpen: true,
        condition: {
          type: "contains",
          value: queryParamValue,
        },
      };
    case "boolean":
      return {
        ...filter,
        isOpen: true,
        condition: { type: "boolean", value: queryParamValue === "true" },
      };
    default:
      return { ...filter, isOpen: false };
  }
};

export default TableFilter;
