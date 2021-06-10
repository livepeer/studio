import { styled } from "../stitches.config";
import { Switch as SwitchBase } from "@modulz/design-system";

export const Switch = styled(SwitchBase, {
  '&[data-state="checked"]': {
    backgroundColor: "$violet9",
    "&:focus": {
      boxShadow: "0 0 0 2px $colors$violet8",
    },
  },
});
