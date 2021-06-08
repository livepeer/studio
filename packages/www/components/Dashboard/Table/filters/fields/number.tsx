import {
    CheckIcon,
    StyledHeader,
    StyledButton,
    StyledItem,
    StyledPanel,
  } from "../helpers";
  import { Box, Text } from "@livepeer.com/design-system";
  import FieldContent from "./field-content";
  
  export type TableFilterNumberFieldProps = {
    label: string;
    isOpen: boolean;
    onToggleOpen: () => void;
  };
  
  const TableFilterNumberField = ({
    label,
    isOpen,
    onToggleOpen,
  }: TableFilterNumberFieldProps) => {
    return (
      <StyledItem value={label}>
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
                backgroundColor: isOpen ? "darkgray" : "transparent",
              }}>
              {isOpen && <CheckIcon />}
            </Box>
            <Text size="2" css={{ marginLeft: "$2", fontWeight: "bolder" }}>
              {label}
            </Text>
          </StyledButton>
        </StyledHeader>
        <StyledPanel>
          <FieldContent label={label} type="number" />
        </StyledPanel>
      </StyledItem>
    );
  };
  
  export default TableFilterNumberField;
  