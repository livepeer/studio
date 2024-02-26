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
import { useState } from "react";

import { PlusCircledIcon } from "@radix-ui/react-icons";

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

const StreamFilter = ({ items, onDone }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    name: "",
    createdAt: "",
    lastSeen: "",
    isActive: "",
  });

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
            labelOn: "Active",
            labelOff: "Idle",
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

  return (
    <Flex
      css={{
        my: "$4",
      }}
      gap={3}
      direction={"row"}>
      {searchFilters.map((filter, index) => (
        <DropdownMenu key={index}>
          <Flex
            as={DropdownMenuTrigger}
            align={"center"}
            gap={1}
            css={{
              p: "$1",
              px: "$2",
              border: "1px dashed",
              fontSize: "$2",
              borderRadius: "20px",
              backgroundColor: "transparent",
              borderColor: "$neutral9",
              color: "$neutral10",
            }}>
            <PlusCircledIcon />
            {filter.name}
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
            {filter.component}
            <Flex
              css={{
                jc: "flex-end",
                mt: "$2",
              }}>
              <Button
                onClick={handleSearch}
                css={{
                  fontWeight: 500,
                }}>
                Search
              </Button>
            </Flex>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </Flex>
  );
};

export default StreamFilter;
