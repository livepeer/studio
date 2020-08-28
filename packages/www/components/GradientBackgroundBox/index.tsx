import { Box } from "@theme-ui/components";
import VioletGradient from "./gradients/Violet";
import Slider from "../Slider";
import { SxStyleProp } from "theme-ui";
import { useMemo } from "react";
import ColorfulGradient from "./gradients/Colorful";
import { isSafari, isFirefox } from "react-device-detect";

export type Gradient = "violet" | "colorful" | null;

type Props = {
  children?: React.ReactNode;
  gradient?: Gradient;
  slide?: boolean;
  sx?: SxStyleProp;
  gradientSx?: SxStyleProp;
  id: string;
};

const GradientBackgroundBox = ({
  children = null,
  sx,
  slide = false,
  gradient = "violet",
  id,
  gradientSx,
  ...moreProps
}: Props) => {
  const Gradient = useMemo(() => {
    switch (gradient) {
      case "violet":
        return VioletGradient;
      case "colorful":
        return ColorfulGradient;
      default:
        return null;
    }
  }, [gradient]);

  return (
    <Box
      sx={{ position: "relative", overflow: "hidden", ...sx }}
      {...moreProps}
    >
      {gradient && !isFirefox && (
        <>
          {slide && !isSafari ? (
            <div
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
                top: 0
              }}
            >
              <Slider duration={3}>
                <Gradient id={id} pushSx={gradientSx} />
              </Slider>
            </div>
          ) : (
            <div
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
                top: 0
              }}
            >
              <Gradient id={id} pushSx={gradientSx} />
            </div>
          )}
        </>
      )}
      {children}
    </Box>
  );
};

export default GradientBackgroundBox;
