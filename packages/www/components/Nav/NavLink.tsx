import type { AnchorHTMLAttributes } from "react";

export const NavLink = ({
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return (
    <a
      className="text-sm cursor-pointer flex items-center text-primary px-2 py-2 rounded-md leading-snug font-medium gap-2 no-underline hover:bg-accent focus:outline-none aria-selected:bg-accent"
      {...rest}
    />
  );
};
