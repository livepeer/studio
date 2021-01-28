import { Box, Flex } from "@theme-ui/components";

const Checkbox = ({
  value,
  onClick,
}: {
  value: boolean;
  onClick: Function;
}) => {
  return (
    <Flex
      sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}
      onClick={onClick}>
      <Box
        sx={{
          width: "12px",
          height: "12px",
          backgroundColor: value ? "primary" : "transparent",
          borderWidth: "1px",
          borderRadius: "3px",
          borderStyle: "solid",
          borderColor: "primary",
        }}
      />
    </Flex>
  );
};

export default Checkbox;
