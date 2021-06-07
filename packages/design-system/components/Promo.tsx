import { styled } from "@modulz/design-system";

const DEFAULT_TAG = "div";

export const Promo = styled(DEFAULT_TAG, {
  // Reset
  boxSizing: "border-box",
  "&::before": {
    boxSizing: "border-box",
  },
  "&::after": {
    boxSizing: "border-box",
  },

  p: "$4",
  display: "grid",
  alignItems: "center",
  borderRadius: "$1",
  gridTemplateColumns: "repeat(2, auto)",

  variants: {
    size: {
      "1": {
        py: "$2",
        px: "$3",
      },
      "2": {
        py: "$3",
        px: "$4",
      },
    },
    variant: {
      loContrast: {
        backgroundColor: "$loContrast",
      },
      gray: {
        backgroundColor: "$slate100",
        boxShadow: "0 0 0 1px $colors$slate500",
      },
      blue: {
        backgroundColor: "$blue200",
        boxShadow: "0 0 0 1px $colors$blue500",
      },
      green: {
        backgroundColor: "$green200",
        boxShadow: "0 0 0 1px $colors$green500",
      },
      indigo: {
        backgroundColor: "$indigo200",
        boxShadow: "0 0 0 1px $colors$indigo500",
      },
      violet: {
        backgroundColor: "$violet200",
        boxShadow: "0 0 0 1px $colors$violet500",
      },
      red: {
        backgroundColor: "$red200",
        boxShadow: "0 0 0 1px $colors$red500",
      },
    },
    rounded: {
      true: {
        borderRadius: "$pill",
      },
    },
    border: {
      true: {
        borderRadius: "$pill",
      },
    },
  },
  compoundVariants: [
    {
      border: "true",
      variant: "gray",
      css: {
        borderColor: "$slate500",
      },
    },
    {
      border: "true",
      variant: "blue",
      css: {
        borderColor: "$blue900",
      },
    },
    {
      border: "true",
      variant: "indigo",
      css: {
        borderColor: "$indigo900",
      },
    },
    {
      border: "true",
      variant: "violet",
      css: {
        borderColor: "$violet900",
      },
    },
    {
      border: "true",
      variant: "loContrast",
      css: {
        borderColor: "$slate500",
      },
    },
  ],
  defaultVariants: {
    size: "1",
    variant: "gray",
  },
});
