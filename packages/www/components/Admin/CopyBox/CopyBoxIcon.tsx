/** @jsxImportSource @emotion/react */
import { jsx } from "theme-ui";
import { Box } from "@theme-ui/components";

const CopyBoxIcon = ({ ...props }) => {
  return (
    <Box
      as="svg"
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.4545 0H1.63636C0.736364 0 0 0.736364 0 1.63636V13.0909H1.63636V1.63636H11.4545V0ZM13.9091 3.27273H4.90909C4.00909 3.27273 3.27273 4.00909 3.27273 4.90909V16.3636C3.27273 17.2636 4.00909 18 4.90909 18H13.9091C14.8091 18 15.5455 17.2636 15.5455 16.3636V4.90909C15.5455 4.00909 14.8091 3.27273 13.9091 3.27273ZM13.9091 16.3636H4.90909V4.90909H13.9091V16.3636Z"
        fill="black"
      />
    </Box>
  );
};

export default CopyBoxIcon;
