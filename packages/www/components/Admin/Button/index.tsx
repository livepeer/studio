import { Button as ButtonBase } from "@livepeer/design-system";

const Button = ({ children, sx, variant, ink = false, ...props }) => (
  <ButtonBase {...props}>{children}</ButtonBase>
);

export default Button;
