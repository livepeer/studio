import {
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardArrow as HoverCardArrowBase,
  Box,
  styled,
  keyframes,
} from "@livepeer.com/design-system";

const slideUpAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateY(2px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const slideRightAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateX(-2px)" },
  "100%": { opacity: 1, transform: "translateX(0)" },
});

const slideDownAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateY(-2px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const slideLeftAndFade = keyframes({
  "0%": { opacity: 0, transform: "translateX(2px)" },
  "100%": { opacity: 1, transform: "translateX(0)" },
});

const StyledContent = styled(HoverCardContent, {
  borderRadius: 8,
  p: "$6",
  width: 240,
  backgroundColor: "$panel",
  boxShadow:
    "hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px",
  "@media (prefers-reduced-motion: no-preference)": {
    animationDuration: "400ms",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "transform, opacity",
    '&[data-state="open"]': {
      '&[data-side="top"]': { animationName: slideDownAndFade },
      '&[data-side="right"]': { animationName: slideLeftAndFade },
      '&[data-side="bottom"]': { animationName: slideUpAndFade },
      '&[data-side="left"]': { animationName: slideRightAndFade },
    },
  },
});

const HoverCardArrow = styled(HoverCardArrowBase, {
  fill: "$panel",
});

const Flex = styled("div", { display: "flex" });

const NavDropdown = ({ trigger, children }) => (
  <HoverCardRoot openDelay={0}>
    <HoverCardTrigger as={Box}>{trigger}</HoverCardTrigger>
    <StyledContent sideOffset={5}>
      <Flex css={{ flexDirection: "column", gap: 7 }}>{children}</Flex>
      <HoverCardArrow />
    </StyledContent>
  </HoverCardRoot>
);

export default NavDropdown;
