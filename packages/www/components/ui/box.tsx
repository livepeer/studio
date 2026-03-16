import { cn } from "lib/utils";
import * as React from "react";

const Box = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
));
Box.displayName = "Box";

export { Box };
