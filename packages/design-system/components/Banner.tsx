import { styled } from "@modulz/design-system";

const DEFAULT_TAG = "div";

export const Banner = styled(DEFAULT_TAG, {
  // Reset
  boxSizing: "border-box",
  "&::before": {
    boxSizing: "border-box",
  },
  "&::after": {
    boxSizing: "border-box",
  },

  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "$3",

  variants: {
    size: {
      "1": {
        py: "$1",
        px: "$4",
      },
    },
    variant: {
      loContrast: {
        backgroundColor: "$loContrast",
      },
      gray: {
        backgroundColor: "$slate200",
      },
      blue: {
        backgroundColor: "$blue200",
      },
      green: {
        backgroundColor: "$green200",
      },
      indigo: {
        backgroundColor: "$indigo200",
      },
      violet: {
        backgroundColor: "$violet200",
      },
      red: {
        backgroundColor: "$red200",
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
