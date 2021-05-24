import { styled, Text } from "@modulz/design-system";

const DEFAULT_TAG = "a";

export const Link = styled(DEFAULT_TAG, {
  alignItems: "center",
  gap: "$1",
  flexShrink: 0,
  outline: "none",
  textDecorationLine: "none",
  textUnderlineOffset: "3px",
  textDecorationColor: "$slate300",
  WebkitTapHighlightColor: "rgba(0,0,0,0)",
  lineHeight: "inherit",
  "@hover": {
    "&:hover": {
      textDecorationLine: "underline",
    },
  },
  "&:focus": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineOffset: "2px",
    textDecorationLine: "none",
  },
  [`& ${Text}`]: {
    color: "inherit",
  },
  variants: {
    variant: {
      blue: {
        color: "$blue900",
        textDecorationColor: "$blue300",
        "&:focus": {
          outlineColor: "$blue700",
        },
      },
      indigo: {
        color: "$indigo900",
        textDecorationColor: "$indigo300",
        "&:focus": {
          outlineColor: "$indigo700",
        },
      },
      violet: {
        color: "$violet900",
        textDecorationColor: "$violet300",
        "&:focus": {
          outlineColor: "$violet700",
        },
      },
      subtle: {
        color: "$slate900",
        textDecorationColor: "$slate300",
        "&:focus": {
          outlineColor: "$slate700",
        },
      },
      contrast: {
        color: "$hiContrast",
        textDecoration: "underline",
        textDecorationColor: "$slate300",
        "@hover": {
          "&:hover": {
            textDecorationColor: "$slate600",
          },
        },
        "&:focus": {
          outlineColor: "$slate700",
        },
      },
    },
  },
  defaultVariants: {
    variant: "contrast",
  },
});
