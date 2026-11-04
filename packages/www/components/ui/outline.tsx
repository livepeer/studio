import { cva } from "class-variance-authority";

const navigationOutlineVariants = cva(
  ["group relative rounded-lg transition", "bg-popover/40 hover:bg-popover/50"],
  {
    variants: {
      indicator: {
        selected: "",
        none: "",
      },
    },
    defaultVariants: {
      indicator: "none",
    },
  },
);

export { navigationOutlineVariants };
