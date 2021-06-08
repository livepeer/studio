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

const TableFilter = ({ items }: TableFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openFields, setOpenFields] = useState<string[]>([]);

  const handleClear = useCallback(() => {
    setOpenFields([]);
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
              const isOpen = openFields.includes(item.label);
              const onToggleOpen = () => {
                if (isOpen) {
                  setOpenFields((p) => p.filter((l) => l !== item.label));
                } else setOpenFields((p) => [...p, item.label]);
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
                      type="date"
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
            {/* {filters.map((each, idx) => (
              <StyledItem value={each.name} key={idx}>
                <StyledHeader>
                  <StyledButton
                    onClick={() =>
                      setSelectedFilter(
                        each.name === selectedFilter ? "" : each.name
                      )
                    }>
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
                        backgroundColor:
                          each.name === selectedFilter
                            ? "darkgray"
                            : "transparent",
                      }}>
                      {each.name === selectedFilter && <CheckIcon />}
                    </Box>
                    <Text
                      size="2"
                      // @ts-ignore
                      css={{ marginLeft: "9px", fontWeight: "500" }}>
                      {each.name}
                    </Text>
                  </StyledButton>
                </StyledHeader>
                <StyledPanel>
                  <DropdownFilter
                    root={each}
                    setSelectedFilters={setSelectedFilters}
                  />
                  <Flex
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
                        maxWidth: each.field === "date" ? "110px" : "100%",
                        height: "26px",
                        borderRadius: "4px",
                        position: "relative",
                        margin: "0px 0px 0px 11px",
                        display: "flex",
                        alignItems: "center",
                        background: "$loContrast",
                      }}>
                      {each.field === "date" && (
                        <Flex
                          as="label"
                          htmlFor={each.name}
                          css={{
                            zIndex: 10,
                            position: "absolute",
                            left: "11px",
                          }}>
                          <CalendarIcon />
                        </Flex>
                      )}
                      <TextField
                        id={each.name}
                        css={{
                          height: "100%",
                          width: "100%",
                          padding:
                            each.field === "date"
                              ? "0px 11px 0px 30px"
                              : "0px 11px",
                          position: "absolute",
                          left: 0,
                          top: 0,
                        }}
                      />
                    </Box>
                  </Flex>
                </StyledPanel>
              </StyledItem>
            ))} */}
          </StyledAccordion>
        </Box>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default TableFilter;
