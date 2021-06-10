import {
  DropdownMenuItem as DropdownMenuItemBase,
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemBase,
  styled,
} from "@modulz/design-system";

export const DropdownMenuItem = styled(DropdownMenuItemBase, {
  variants: {
    ...DropdownMenuItemBase.variants,
    color: {
      violet: {
        "&:focus": {
          outline: "none",
          backgroundColor: "$violet9",
          color: "white",
        },
      },
      red: {
        color: "$red11",
        "&:focus": {
          backgroundColor: "$red4",
          color: "$red11",
        },
      },
    },
  },
  defaultVariants: {
    color: "violet",
  },
});

export const DropdownMenuCheckboxItem = styled(DropdownMenuCheckboxItemBase, {
  variants: {
    color: {
      violet: {
        "&:focus": {
          outline: "none",
          backgroundColor: "$violet9",
          color: "white",
        },
      },
      red: {
        color: "$red11",
        "&:focus": {
          backgroundColor: "$red4",
          color: "$red11",
        },
      },
    },
  },
  defaultVariants: {
    color: "violet",
  },
});
