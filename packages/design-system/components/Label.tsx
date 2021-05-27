import React from "react";
import { Text } from "@modulz/design-system";
import * as BaseLabel from "@radix-ui/react-label";
import type * as Polymorphic from "@radix-ui/react-polymorphic";

type LabelOwnProps = Polymorphic.OwnProps<typeof BaseLabel.Root>;

type LabelComponent = Polymorphic.ForwardRefComponent<
  Polymorphic.IntrinsicElement<typeof BaseLabel.Root>,
  LabelOwnProps
>;

export const Label = React.forwardRef((props, forwardedRef) => {
  return <Text as={BaseLabel.Root} {...props} ref={forwardedRef} />;
}) as LabelComponent;
