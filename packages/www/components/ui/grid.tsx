import * as React from "react";

import { Box } from "./box";
import { cn } from "lib/utils";

const Grid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Box ref={ref} className={cn("grid", className)} {...props} />
));
Grid.displayName = "Grid";

export { Grid };
