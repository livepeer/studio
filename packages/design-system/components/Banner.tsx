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
        backgroundColor: "$slate3",
      },
      blue: {
        backgroundColor: "$blue3",
      },
      green: {
        backgroundColor: "$green3",
      },
      indigo: {
        backgroundColor: "$indigo3",
      },
      violet: {
        backgroundColor: "$violet3",
      },
      red: {
        backgroundColor: "$red3",
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
        borderColor: "$slate6",
      },
    },
  ],
  defaultVariants: {
    size: "1",
    variant: "gray",
  },
});
