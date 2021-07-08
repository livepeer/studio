import { styled, Text } from "@modulz/design-system";

const DEFAULT_TAG = "a";

export const Link = styled(DEFAULT_TAG, {
  alignItems: "center",
  gap: "$1",
  flexShrink: 0,
  outline: "none",
  textDecorationLine: "none",
  textUnderlineOffset: "3px",
  textDecorationColor: "$mauve4",
  WebkitTapHighlightColor: "rgba(0,0,0,0)",
  lineHeight: "inherit",
  "@hover": {
    "&:hover": {
      textDecorationLine: "underline",
    },
  },
  "&:focus": {
    outline: "none",
    textDecorationLine: "none",
  },
  [`& ${Text}`]: {
    color: "inherit",
  },
  variants: {
    variant: {
      blue: {
        color: "$blue11",
        textDecorationColor: "$blue4",
        "&:focus": {
          outlineColor: "$blue8",
        },
      },
      indigo: {
        color: "$indigo11",
        textDecorationColor: "$indigo4",
        "&:focus": {
          outlineColor: "$indigo8",
        },
      },
      violet: {
        color: "$violet11",
        textDecorationColor: "$violet4",
        "&:focus": {
          outlineColor: "$violet8",
        },
      },
      subtle: {
        color: "$mauve11",
        textDecorationColor: "$mauve4",
        "&:focus": {
          outlineColor: "$mauve8",
        },
      },
      contrast: {
        color: "$hiContrast",
        textDecoration: "underline",
        textDecorationColor: "$mauve4",
        "@hover": {
          "&:hover": {
            textDecorationColor: "$mauve7",
          },
        },
        "&:focus": {
          outlineColor: "$mauve8",
        },
      },
    },
  },
  defaultVariants: {
    variant: "contrast",
  },
});
