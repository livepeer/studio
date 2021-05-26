import * as DialogPrimitive from "@radix-ui/react-dialog";
import { css, keyframes, styled } from "../stitches.config";
import { Cross1Icon } from "@radix-ui/react-icons";
import React from "react";
import { IconButton } from "@modulz/design-system";

import type * as Polymorphic from "@radix-ui/react-polymorphic";

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root> & {
  children: React.ReactNode;
};

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const scaleIn = keyframes({
  from: { transform: "translate(-50%, -50%) scale(0.9)" },
  to: { transform: "translate(-50%, -50%) scale(1)" },
});

const fadeout = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const StyledOverlay = styled(DialogPrimitive.Overlay, {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "rgba(0,0,0,.35)",
  inset: 0,

  variants: {
    animation: {
      true: {
        '&[data-state="open"]': {
          animation: `${fadeIn} 300ms ease-out`,
        },

        '&[data-state="closed"]': {
          animation: `${fadeout} 200ms ease-out`,
        },
      },
    },
  },
});

export function Dialog({ children, ...props }: DialogProps) {
  return (
    <DialogPrimitive.Root {...props}>
      <StyledOverlay animation />
      {children}
    </DialogPrimitive.Root>
  );
}

const content = css({
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: 200,
  maxHeight: "85vh",
  padding: "$4",
  marginTop: "-5vh",
  backgroundColor: "$panel",
  borderRadius: "$3",
  boxShadow:
    "$colors$shadowLight 0px 10px 38px -10px, $colors$shadowDark 0px 10px 20px -15px",
  color: "$black",

  variants: {
    animation: {
      fade: {
        '&[data-state="open"]': {
          animation: `${fadeIn} 300ms ease-out`,
        },

        '&[data-state="closed"]': {
          animation: `${fadeout} 200ms ease-out`,
        },
      },
      scale: {
        animation: `${fadeIn} 300ms ease-out, ${scaleIn} 200ms ease-out`,
      },
    },
  },

  "&:focus": {
    outline: "none",
  },
});

const StyledCloseButton = styled(IconButton, {
  position: "absolute",
  top: "$2",
  right: "$2",
});

type DialogContentOwnProps = Polymorphic.OwnProps<
  typeof DialogPrimitive.Content
> & {
  css?: any;
};

type DialogContentComponent = Polymorphic.ForwardRefComponent<
  Polymorphic.IntrinsicElement<typeof DialogPrimitive.Content>,
  DialogContentOwnProps
>;

export const DialogContent = React.forwardRef(
  ({ children, animation = "scale", ...props }: any, forwardedRef) => (
    <DialogPrimitive.Content
      {...props}
      className={content({ animation })}
      ref={forwardedRef}>
      {children}
      <DialogPrimitive.Close
        as={StyledCloseButton}
        variant="ghost"
        css={{
          mixBlendMode: "initial",
        }}>
        <Cross1Icon />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  )
) as DialogContentComponent;

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
