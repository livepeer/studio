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
        backgroundColor: "$slate2",
        boxShadow: "0 0 0 1px $colors$slate6",
      },
      blue: {
        backgroundColor: "$blue2",
        boxShadow: "0 0 0 1px $colors$blue6",
      },
      green: {
        backgroundColor: "$green2",
        boxShadow: "0 0 0 1px $colors$green6",
      },
      indigo: {
        backgroundColor: "$indigo2",
        boxShadow: "0 0 0 1px $colors$indigo6",
      },
      violet: {
        backgroundColor: "$violet2",
        boxShadow: "0 0 0 1px $colors$violet6",
      },
      red: {
        backgroundColor: "$red2",
        boxShadow: "0 0 0 1px $colors$red6",
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
        borderColor: "$slate6",
      },
    },
    {
      border: "true",
      variant: "blue",
      css: {
        borderColor: "$blue11",
      },
    },
    {
      border: "true",
      variant: "indigo",
      css: {
        borderColor: "$indigo11",
      },
    },
    {
      border: "true",
      variant: "violet",
      css: {
        borderColor: "$violet11",
      },
    },
    {
      border: "true",
      variant: "loContrast",
      css: {
        borderColor: "$slate6",
      },
    },
  ],
  defaultVariants: {
    size: "1",
    variant: "gray",
  },
});
