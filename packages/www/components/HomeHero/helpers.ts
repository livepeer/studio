import { phoneFrameMaxWidth, phoneFrameMaxHeight } from "./PhoneSvg";

const phonePadding = 48;

const maxScroll = 1082;
const scrollToEnterPhone = maxScroll - phoneFrameMaxHeight;

type Breakpoint = {
  initial: number;
  target: number;
};

const breakpoints: { [key: string]: Breakpoint } = {
  bottom: {
    initial: maxScroll,
    target: phoneFrameMaxHeight
  },
  rotateX: {
    initial: 45,
    target: 0
  },
  opacity: {
    initial: 1,
    target: 0
  },
  maxWidth: {
    initial: 916,
    target: phoneFrameMaxWidth - phonePadding // 40 is the padding of the phone
  },
  aspectRatio: {
    initial: 50,
    target: 46.5
  },
  borderRadius: {
    initial: 24,
    target: 36
  }
};

breakpoints.bottomSecondPhase = {
  initial: breakpoints.bottom.target,
  target: 24
};

// Formatters
const toPx = (v: number) => `${v}px`;
const toPercent = (v: number) => `${v.toFixed(2)}%`;
const getTransform = (rotateX: number) =>
  `perspective(800px) rotateX(${rotateX}deg) rotateY(0deg) scale(1)`;

/**
 * To calculate value in proportion of the scrollTop
 */
function getProportionalValue(
  scrollTop: number,
  breakpoint: Breakpoint,
  formatter = (value: number) => `${value}`,
  scrollFrom = 0,
  scrollTo = scrollToEnterPhone
) {
  // 1. We get the fraction scrolled
  const currentScrollFraction =
    (scrollTop - scrollFrom) / (scrollTo - scrollFrom);
  if (currentScrollFraction > 1) return formatter(breakpoint.target);
  // 2. We get the scope
  const scope = breakpoint.initial - breakpoint.target;
  // 3. We calculate what we'll substract from the total
  const toSubstract = scope * currentScrollFraction;
  // 4. Substract and format
  const value = breakpoint.initial - toSubstract;
  return formatter(value);
}

export {
  maxScroll,
  scrollToEnterPhone,
  breakpoints,
  getTransform,
  toPx,
  toPercent,
  getProportionalValue
};
