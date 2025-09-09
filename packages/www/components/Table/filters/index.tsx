import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Box, Flex, Text, Checkbox } from "@livepeer/design-system";
import { Button } from "components/ui/button";
import { useCallback, useState, useEffect } from "react";
import {
  FilterIcon,
  StyledAccordion,
  StyledHeader,
  StyledItem,
  StyledPanel,
} from "./helpers";
import FieldContent from "./fields";
import { format, addDays, addMinutes } from "date-fns";
import { useRouter } from "next/router";
import { makeQuery, QueryParams } from "lib/utils/router";

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

export type FilterItem = { id: string; label: string } & (
  | { type: "text" | "number" | "date" }
  | { type: "boolean"; labelOn: string; labelOff: string }
);

export type FilterType = FilterItem["type"];

export type ApplyFilterHandler = (filters: Filter[]) => void;

function getActiveFiltersCount(filters: Filter[]) {
  return filters.filter((item) => item.isOpen).length;
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
      p.map((f) => ({ ...f, isOpen: false, condition: undefined }))
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
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary" size="sm">
          <Flex css={{ mr: "$2" }}>
            <FilterIcon />
          </Flex>
          Filter
          {getActiveFiltersCount(filters) > 0 && (
            <>
              <Box
                as="span"
                css={{
                  mx: "$2",
                  height: "16px",
                  width: "1px",
                  background: "$neutral6",
                }}
              />
              <Box as="span">{getActiveFiltersCount(filters)}</Box>
            </>
          )}
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
            border: "1px solid $colors$neutral5",
            marginRight: "6px",
            borderRadius: "4px",
            overflow: "hidden",
            boxShadow: "0px 5px 15px -5px hsl(206deg 22% 7% / 15%)",
          }}>
          <Flex
            css={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 7px",
              background: "$panel",
            }}>
            <Button onClick={handleClear} size="sm" variant="outline">
              Clear
            </Button>
            <Text size="2" css={{ margin: "0px" }}>
              Filters
            </Text>
            <Button size="sm" onClick={handleDone}>
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
                        return { ...f, isOpen: false as false };
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
                          ...f,
                          isOpen: true as true,
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
                      return { ...f, condition, isOpen: true };
                    }),
                  ];
                  return newFilters;
                });
              };

              return (
                <StyledItem value={filter.label} key={i}>
                  <StyledHeader onClick={onToggleOpen}>
                    <Checkbox
                      placeholder="isOpen"
                      checked={filter.isOpen}
                      onCheckedChange={onToggleOpen}
                      onClick={onToggleOpen}
                    />

                    <Text
                      size="2"
                      css={{
                        cursor: "default",
                        marginLeft: "$2",
                        fontWeight: 500,
                      }}>
                      {filter.label}
                    </Text>
                  </StyledHeader>
                  <StyledPanel>
                    <FieldContent
                      filter={filter}
                      onConditionChange={onConditionChange}
                    />
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

type Parsers = {
  parseNumber: (value: number) => number;
};

export const formatFiltersForApiRequest = (
  filters: Filter[],
  parsers?: Partial<Parsers>
) => {
  const normalized: { id: string; value: any }[] = [];
  const typedParsers: Parsers = {
    parseNumber: parsers?.parseNumber ?? ((n) => n),
  };
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
      case "numberEqual":
        normalized.push({
          id: filter.id,
          value: {
            gte: typedParsers.parseNumber(filter.condition.value),
            lte: typedParsers.parseNumber(filter.condition.value),
          },
        });
        break;
      case "numberBetween":
        normalized.push({
          id: filter.id,
          value: {
            gte: typedParsers.parseNumber(filter.condition.value[0]),
            lte: typedParsers.parseNumber(filter.condition.value[1]),
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
      case "numberEqual":
        normalized.push({
          id: filter.id,
          value: `${filter.condition.value}`,
        });
        break;
      case "numberBetween":
        normalized.push({
          id: filter.id,
          value: `${filter.condition.value[0]},${filter.condition.value[1]}`,
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
    case "date": {
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
    }
    case "number": {
      const splitted1 = decodedValue.split(",");
      const isNumberBetween = splitted1.length > 1;
      return {
        ...filter,
        isOpen: true,
        // @ts-ignore
        condition: {
          type: isNumberBetween ? "numberBetween" : "numberEqual",
          value: isNumberBetween
            ? (splitted1.map((s) => parseInt(s)) as [number, number])
            : parseInt(splitted1[0]),
        },
      };
    }
    default:
      break;
  }
};

export default TableFilter;
