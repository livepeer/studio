import type { AnchorHTMLAttributes } from "react";

import { cn } from "lib/cn";

export const NavLink = ({
  isChild,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { isChild?: boolean }) => {
  return (
    <a
      className={cn(
        "text-sm cursor-pointer flex items-center text-primary px-2 py-2 rounded-md leading-snug font-medium gap-2 no-underline hover:bg-accent focus:outline-none aria-selected:bg-accent",
        isChild && "pl-8",
      )}
      {...rest}
    />
  );
};
