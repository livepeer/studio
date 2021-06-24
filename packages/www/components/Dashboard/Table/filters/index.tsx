import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Box, Button, Flex, Text } from "@livepeer.com/design-system";
import { useCallback, useState, useEffect } from "react";
import {
  FilterIcon,
  StyledAccordion,
  CheckIcon,
  StyledHeader,
  StyledButton,
  StyledItem,
  StyledPanel,
} from "./helpers";
import FieldContent from "./fields";
import { format, addDays, addMinutes } from "date-fns";
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
  const [previousFilters, setPreviousFilters] = useState<Filter[]>([]);

  const handleClear = useCallback(() => {
    setFilters((p) =>
      p.map((f) => ({ label: f.label, type: f.type, id: f.id, isOpen: false }))
    );
  }, []);

  const handleDone = useCallback(async () => {
    setIsOpen(false);
    onDone(filters);
    setActiveFiltersCount(getActiveFiltersCount(filters));
    const formatted = formatFiltersForQueryParam(filters);
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
      if (searchParamValue === null) return { ...item, isOpen: false };
      return formatFilterItemFromQueryParam(item, searchParamValue);
    });
    onDone(itemsFromQueryParams);
    setFilters(itemsFromQueryParams);
    setActiveFiltersCount(getActiveFiltersCount(itemsFromQueryParams));
  }, [items]);

  const handleOpenChange = useCallback(
    (isNowOpen) => {
      if (isNowOpen) {
        setIsOpen(true);
        setPreviousFilters(filters);
      } else {
        setIsOpen(false);
        setFilters(previousFilters);
      }
    },
    [filters, previousFilters]
  );

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={handleOpenChange}>
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
                          case "boolean":
                            defaultCondition = {
                              type: "boolean",
                              value: false,
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
                        condition,
                        isOpen: true,
                        label: f.label,
                        type: f.type,
                        id: f.id,
                      };
                    }),
                  ];
                  return newFilters;
                });
              };

              return (
                <StyledItem value={filter.label} key={i}>
                  <StyledHeader>
                    <StyledButton onClick={onToggleOpen}>
                      <Box
                        css={{
                          minWidth: "13px",
                          minHeight: "13px",
                          borderRadius: "4px",
                          boxShadow: "0px 0px 2px #000000",
                          margin: "0px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: filter.isOpen
                            ? "darkgray"
                            : "transparent",
                        }}>
                        {filter.isOpen && <CheckIcon />}
                      </Box>
                      <Text
                        size="2"
                        css={{ marginLeft: "$2", fontWeight: "bolder" }}>
                        {filter.label}
                      </Text>
                    </StyledButton>
                  </StyledHeader>
                  <StyledPanel>
                    {filter.isOpen && (
                      <FieldContent
                        label={filter.label}
                        type={filter.type}
                        condition={filter.isOpen ? filter.condition : null}
                        onConditionChange={onConditionChange}
                      />
                    )}
                  </StyledPanel>
                </StyledItem>
              );
            })}
          </StyledAccordion>
        </Box>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export const formatFiltersForApiRequest = (filters: Filter[]) => {
  const normalized: { id: string; value: any }[] = [];
  filters.forEach((filter) => {
    if (!filter.isOpen) return;
    switch (filter.condition.type) {
      case "contains":
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
      case "dateEqual":
        normalized.push({
          id: filter.id,
          value: {
            gte: new Date(filter.condition.value).getTime(),
            lte: addDays(new Date(filter.condition.value), 1).getTime(),
          },
        });
        break;
      case "dateBetween":
        normalized.push({
          id: filter.id,
          value: {
            gte: new Date(filter.condition.value[0]).getTime(),
            lte: addDays(new Date(filter.condition.value[1]), 1).getTime(),
          },
        });
        break;
      default:
        break;
    }
  });
  return normalized;
};

export const formatFiltersForQueryParam = (filters: Filter[]) => {
  const normalized: { id: string; value: string }[] = [];
  filters.forEach((filter) => {
    if (!filter.isOpen) return;
    switch (filter.condition.type) {
      case "contains":
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
      case "dateEqual":
        normalized.push({
          id: filter.id,
          value: `${new Date(filter.condition.value).getTime()}`,
        });
        break;
      case "dateBetween":
        normalized.push({
          id: filter.id,
          value: `${new Date(filter.condition.value[0]).getTime()},${new Date(
            filter.condition.value[1]
          ).getTime()}`,
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
  const decodedValue = decodeURIComponent(queryParamValue);
  switch (filter.type) {
    case "text":
      return {
        ...filter,
        isOpen: true,
        condition: {
          type: "contains",
          value: decodedValue,
        },
      };
    case "boolean":
      return {
        ...filter,
        isOpen: true,
        condition: { type: "boolean", value: decodedValue === "true" },
      };
    case "date":
      const splitted = decodedValue.split(",");
      const isDateBetween = splitted.length > 1;
      const timezoneOffset = new Date().getTimezoneOffset();
      return {
        ...filter,
        isOpen: true,
        // @ts-ignore
        condition: {
          type: isDateBetween ? "dateBetween" : "dateEqual",
          value: isDateBetween
            ? (splitted.map((s) =>
                format(
                  addMinutes(new Date(parseInt(s)), timezoneOffset),
                  "yyyy-MM-dd"
                )
              ) as [string, string])
            : format(
                addMinutes(new Date(parseInt(splitted[0])), timezoneOffset),
                "yyyy-MM-dd"
              ),
        },
      };
    default:
      return { ...filter, isOpen: false };
  }
};

export default TableFilter;
