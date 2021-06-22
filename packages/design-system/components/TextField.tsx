import { styled } from "../stitches.config";

const DEFAULT_TAG = "input";

const StyledTextField = styled(DEFAULT_TAG, {
  // Reset
  appearance: "none",
  borderWidth: "0",
  boxSizing: "border-box",
  fontFamily: "inherit",
  margin: "0",
  outline: "none",
  padding: "0",
  width: "100%",
  WebkitTapHighlightColor: "rgba(0,0,0,0)",
  lineHeight: "1",
  "&::before": {
    boxSizing: "border-box",
  },
  "&::after": {
    boxSizing: "border-box",
  },

  // Custom
  backgroundColor: "$loContrast",
  boxShadow: "inset 0 0 0 1px $colors$mauve7",
  color: "$hiContrast",
  fontVariantNumeric: "tabular-nums",

  "&:-webkit-autofill": {
    boxShadow:
      "inset 0 0 0 1px $colors$violet6, inset 0 0 0 100px $colors$violet3",
  },

  "&:-webkit-autofill::first-line": {
    fontFamily: "$untitled",
    color: "$hiContrast",
  },

  "&:focus": {
    boxShadow:
      "inset 0px 0px 0px 1px $colors$violet8, 0px 0px 0px 1px $colors$violet8",
    "&:-webkit-autofill": {
      boxShadow:
        "inset 0px 0px 0px 1px $colors$violet8, 0px 0px 0px 1px $colors$violet8, inset 0 0 0 100px $colors$violet3",
    },
  },
  "&::placeholder": {
    color: "$mauve9",
  },
  "&:disabled": {
    pointerEvents: "none",
    backgroundColor: "$mauve2",
    color: "$mauve8",
    cursor: "not-allowed",
    "&::placeholder": {
      color: "$mauve7",
    },
  },
  "&:read-only": {
    backgroundColor: "$mauve2",
    "&:focus": {
      boxShadow: "inset 0px 0px 0px 1px $colors$mauve7",
    },
  },

  variants: {
    size: {
      "1": {
        borderRadius: "$1",
        height: "$5",
        fontSize: "$1",
        px: "$1",
        "&:-webkit-autofill::first-line": {
          fontSize: "$1",
        },
      },
      "2": {
        borderRadius: "$2",
        height: "$6",
        fontSize: "$3",
        px: "$2",
        "&:-webkit-autofill::first-line": {
          fontSize: "$3",
        },
      },
    },
    variant: {
      ghost: {
        boxShadow: "none",
        backgroundColor: "transparent",
        "@hover": {
          "&:hover": {
            boxShadow: "inset 0 0 0 1px $colors$mauveA7",
          },
        },
        "&:focus": {
          backgroundColor: "$loContrast",
          boxShadow:
            "inset 0px 0px 0px 1px $colors$violet8, 0px 0px 0px 1px $colors$violet8",
        },
        "&:disabled": {
          backgroundColor: "transparent",
        },
        "&:read-only": {
          backgroundColor: "transparent",
        },
      },
    },
    state: {
      invalid: {
        boxShadow: "inset 0 0 0 1px $colors$red7",
        "&:focus": {
          boxShadow:
            "inset 0px 0px 0px 1px $colors$red8, 0px 0px 0px 1px $colors$red8",
        },
      },
      valid: {
        boxShadow: "inset 0 0 0 1px $colors$green7",
        "&:focus": {
          boxShadow:
            "inset 0px 0px 0px 1px $colors$green8, 0px 0px 0px 1px $colors$green8",
        },
      },
    },
    cursor: {
      default: {
        cursor: "default",
        "&:focus": {
          cursor: "text",
        },
      },
      text: {
        cursor: "text",
      },
    },
  },
  defaultVariants: {
    size: "1",
  },
});

export const TextField = StyledTextField;
