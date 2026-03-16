import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "lib/utils";

const textVariants = cva("unset transition-colors", {
  variants: {
    variant: {
      default: "text-foreground",
      neutral: "text-muted-foreground",
      primary: "text-primary",
      error: "text-destructive",
      link: "inline cursor-pointer text-foreground hover:underline",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl/[1.03]",
      "5xl": "text-4xl/[1.05] md:text-5xl/[1.05]",
      "6xl": "text-5xl/[1.05] md:text-6xl/[1.05]",
      "7xl": "text-6xl/[1.05] md:text-7xl/[1.05]",
    },
    weight: {
      thin: "font-thin",
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
      black: "font-black",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    weight: "normal",
  },
});

export type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
  };

const sizeMap = {
  "7xl": "h1",
  "6xl": "h1",
  "5xl": "h1",
  "4xl": "h2",
  "3xl": "h2",
  "2xl": "h2",
  xl: "h3",
  lg: "h4",
  default: "p",
  sm: "p",
  xs: "p",
} as const satisfies {
  [key in Exclude<TextProps["size"], null | undefined>]: string;
};

const Text = React.forwardRef<HTMLHeadingElement, TextProps>(
  ({ className, size, variant, weight, asChild, ...props }, ref) => {
    const Comp = asChild
      ? Slot
      : variant === "link"
        ? "span"
        : sizeMap[size ?? "default"];

    return (
      <Comp
        className={cn(
          textVariants({
            size,
            variant,
            weight,
            className,
          }),
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

export { Text, textVariants };
