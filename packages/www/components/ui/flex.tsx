import * as React from "react";

import { cn } from "lib/utils";
import { Box } from "./box";

const Flex = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Box ref={ref} className={cn("flex", className)} {...props} />
));
Flex.displayName = "Flex";

export { Flex };
