import {
  Button,
  Flex,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  styled,
  TextField,
  Select,
} from "@livepeer/design-system";
import { useEffect, useState } from "react";

import { CrossCircledIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/router";

type SearchFilters = {
  name: string;
  createdAt: string;
  lastSeen: string;
  isActive: string;
};

const DateInput = styled("input", {
  WebkitAppearance: "none",
  border: "1px solid",
  backgroundColor: "transparent",
  borderColor: "$neutral7",
  color: "$neutral9",
  outline: "none",
  width: "94%",
  borderRadius: "$1",
  p: "4px",
});

const StreamFilter = ({ onDone, activeFilters }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    name: "",
    createdAt: "",
    lastSeen: "",
    isActive: "",
  });

  const [outputFilters, setOutputFilters] = useState([]);
  const router = useRouter();

  const handleChange = (name: keyof typeof filters, value: string) => {
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleSearch = () => {
    const outputFilters = searchFilters.reduce((acc, filter) => {
      const filterValue = filters[filter.id];

      if (filterValue === "" || filterValue === undefined) return acc;

      let baseStructure = {
        label: filter.name,
        isOpen: true,
        type: filter.type,
        id: filter.id,
      };

      let condition;
      switch (filter.id) {
        case "name":
          condition = { type: "contains", value: filterValue };
          break;
        case "createdAt":
        case "lastSeen":
          condition = { type: "dateEqual", value: filterValue };
          break;
        case "isActive":
          condition = { type: "boolean", value: filterValue === "true" };
          baseStructure = {
            ...baseStructure,
            label: "Active",
          };
          break;
        default:
          condition = null;
      }

      if (condition) {
        acc.push({ ...baseStructure, condition });
      }

      return acc;
    }, []);

    const query = outputFilters.reduce((acc, filter) => {
      acc[filter.id] = filter.condition.value;
      return acc;
    }, {});

    router.push({ query });

    setOutputFilters(outputFilters);
    onDone(outputFilters);
  };

  const searchFilters = [
    {
      name: "Name",
      type: "text",
      id: "name",
      component: (
        <TextField
          value={filters.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Name"
        />
      ),
    },
    {
      name: "Date created",
      type: "date",
      id: "createdAt",
      component: (
        <DateInput
          type="date"
          value={filters.createdAt}
          onChange={(e) => handleChange("createdAt", e.target.value)}
        />
      ),
    },
    {
      name: "Last seen",
      type: "date",
      id: "lastSeen",
      component: (
        <DateInput
          type="date"
          value={filters.lastSeen}
          onChange={(e) => handleChange("lastSeen", e.target.value)}
        />
      ),
    },
    {
      name: "Status",
      type: "boolean",
      id: "isActive",
      component: (
        <Select
          value={String(filters.isActive)}
          onChange={(e) => handleChange("isActive", e.target.value)}>
          <option value="" disabled selected>
            Select an option
          </option>
          <option value="true">Active</option>
          <option value="false">Idle</option>
        </Select>
      ),
    },
  ];

  const clearFilter = () => {
    setOutputFilters([]);
    onDone([]);
    router.push({ query: {} });
    setFilters({
      name: "",
      createdAt: "",
      lastSeen: "",
      isActive: "",
    });
  };

  useEffect(() => {
    if (activeFilters.length > 0) {
      setOutputFilters(activeFilters);
      const filters = activeFilters.reduce((acc, filter) => {
        if (filter.condition.type === "dateEqual") {
          acc[filter.id] = filter.condition.value;
        } else {
          acc[filter.id] = String(filter.condition.value);
        }

        return acc;
      }, {});

      setFilters((prevFilters) => ({ ...prevFilters, ...filters }));
    }
  }, [activeFilters]);

  return (
    <Flex gap={3} direction={"row"}>
      {searchFilters.map((filter, index) => {
        const isActive = outputFilters?.find((f) => f.id === filter.id);
        const value = isActive?.condition?.value;
        return (
          <DropdownMenu key={index}>
            <Flex
              as={!isActive && DropdownMenuTrigger}
              align={"center"}
              gap={1}
              css={{
                p: "$1",
                px: "$2",
                cursor: "default",
                border: "1px dashed",
                fontSize: "$2",
                borderRadius: "20px",
                backgroundColor: "transparent",
                borderColor: isActive ? "$primary8" : "$neutral9",
                color: isActive ? "$primary9" : "$neutral9",
                "&:hover": {
                  borderColor: "$primary8",
                  color: "$primary9",
                  transition: "0.3s",
                },
              }}>
              {isActive ? (
                <CrossCircledIcon
                  onClick={() => {
                    const newFilters = outputFilters.filter(
                      (f) => f.id !== filter.id
                    );
                    setOutputFilters(newFilters);
                    onDone(newFilters);
                    setFilters((prevFilters) => ({
                      ...prevFilters,
                      [filter.id]: "",
                    }));
                  }}
                  style={{
                    pointerEvents: "auto",
                    overflow: "visible",
                  }}
                />
              ) : (
                <PlusCircledIcon />
              )}
              {filter.name} {isActive && " | " + value}
            </Flex>
            <DropdownMenuContent
              placeholder={"more options"}
              css={{
                border: "1px solid $colors$neutral6",
                p: "$2",
                ml: "7rem",
                width: "15rem",
                mt: "$2",
              }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}>
                {filter.component}
                <Flex
                  css={{
                    jc: "flex-end",
                    mt: "$2",
                  }}>
                  <Button
                    type="submit"
                    css={{
                      fontWeight: 500,
                      cursor: "default",
                    }}>
                    Apply
                  </Button>
                </Flex>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {outputFilters.length > 0 && (
        <Button
          onClick={clearFilter}
          css={{
            backgroundColor: "transparent",
            fontWeight: 600,
            color: "$neutral10",
            p: "$3",
            pl: "0",
            borderRadius: "$1",
            cursor: "default",
            "&:hover": {
              backgroundColor: "transparent",
              color: "$neutral11",
            },
          }}>
          Clear filters
        </Button>
      )}
    </Flex>
  );
};

export default StreamFilter;
