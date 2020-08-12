import { Button } from "@theme-ui/components";
import Ink from "react-ink";

export default ({ children, ink = false, ...props }) => {
  return (
    <Button {...props} sx={{ position: "relative" }}>
      {ink && <Ink />}
      {children}
    </Button>
  );
};
