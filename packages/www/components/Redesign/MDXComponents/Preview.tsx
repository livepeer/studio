import { Box } from "@livepeer.com/design-system";

const Preview = ({ css, ...props }) => (
  <Box
    {...props}
    data-preview
    css={{
      backgroundColor: "$purple9",
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      py: 100,
      borderRadius: "$3",
      ...(css as any),
    }}
  />
);

export default Preview;
