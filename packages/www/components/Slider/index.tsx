import { SxStyleProp } from "theme-ui";
import { keyframes } from "@emotion/core";
import { useCallback, useEffect, useRef } from "react";

const isDev = process.env.NODE_ENV === "development";

const slide = keyframes`
from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-50%, 0, 0);
  }
`;

type Props = {
  duration?: number;
  pushSx?: SxStyleProp;
  isFullScreen?: boolean;
  numberOfCopies?: number;
};

const Slider: React.FC<Props> = ({
  duration = 10,
  children,
  pushSx,
  isFullScreen = true,
  numberOfCopies = 2
}) => {
  if (numberOfCopies % 2 !== 0 && isDev) {
    throw new Error("numberOfCopies must be even");
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const getChild = useCallback(
    (n: number) => (typeof children === "function" ? children(n) : children),
    []
  );

  useEffect(() => {
    if (isFullScreen && containerRef.current) {
      const { left } = containerRef.current.getBoundingClientRect();
      containerRef.current.style.left = `-${{ left }}px`;
    }
  }, [isFullScreen, containerRef]);

  return (
    <div
      ref={containerRef}
      sx={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
        width: isFullScreen ? "100vw" : "100%",
        ...pushSx
      }}
    >
      <div
        sx={{
          display: "inline-block",
          whiteSpace: "nowrap",
          overflow: "hidden",
          animation: `${slide} ${duration * 2}s linear infinite`
        }}
      >
        {Array.from({ length: numberOfCopies }, (_, i) => i + 1).map((n) => (
          <div
            key={`auto-slider-copy-${n}`}
            sx={{
              display: "inline-flex",
              "& > div": { display: "inline-block" }
            }}
          >
            {getChild(n)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Slider;
