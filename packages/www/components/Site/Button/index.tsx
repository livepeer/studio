import { Box, Button as ButtonBase } from "@livepeer/design-system";
import React from "react";

// TODO: move this component into design system package as a button variant
export const Button = React.forwardRef(
  (
    { arrow = false, small = false, children, css = {}, ...props }: any,
    forwardedRef
  ) => (
    <ButtonBase
      ref={forwardedRef}
      variant="blue"
      css={{
        bc: "#0a5cd8",
        color: "white",
        fontSize: small ? 20 : 34,
        fontWeight: 500,
        borderRadius: "$1",
        px: small ? "6px" : "4px",
        py: small ? 0 : "2px",
        height: "initial",
        textTransform: "uppercase",
        border: "2px solid transparent",
        ...css,
      }}
      size="3"
      {...props}>
      {children}
    </ButtonBase>
  )
);

export default Button;
