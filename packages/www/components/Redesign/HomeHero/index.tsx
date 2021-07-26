import {
  TextField,
  Text,
  Flex,
  Container,
  Box,
} from "@livepeer.com/design-system";
import Button from "components/Redesign/Button";
import HeroVideo from "./Video";
import PhoneSvg from "./PhoneSvg";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useRef } from "react";
import { useCallback } from "react";
import {
  getProportionalValue,
  breakpoints,
  maxScroll,
  getDynamicBreakpoints,
  getPhonePadding,
} from "./helpers";
import { notchZIndex } from "./PhoneSvg";
import Guides from "components/Redesign/Guides";

const HomeHero = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!videoRef.current || !phoneRef.current || !videoContainerRef.current) {
      return;
    }
    const dynamicBreakpoints = getDynamicBreakpoints();
    const { scrollTop } = document.documentElement;
    const figure = videoRef.current.querySelector("figure") as HTMLElement;
    const gradient = videoRef.current.querySelector(
      "#background-gradient"
    ) as HTMLDivElement;

    // Some calculations to know when to remove `position: fixed` on the video
    const { offsetHeight } = phoneRef.current;
    const { top } = phoneRef.current.getBoundingClientRect();
    const isPlacedOnPhone = top + offsetHeight / 2 <= window.innerHeight / 2;
    if (isPlacedOnPhone) {
      // Animate bottom first phase
      videoContainerRef.current.style.position = "absolute";
      videoContainerRef.current.style.transform = "none";
      videoContainerRef.current.style.left = "unset";
      videoContainerRef.current.style.top = "unset";
      videoContainerRef.current.style.bottom = `${getPhonePadding()}px`;
    } else {
      videoContainerRef.current.style.position = "fixed";
      videoContainerRef.current.style.transform = "translate(-50%, -50%)";
      videoContainerRef.current.style.left = "50%";
      videoContainerRef.current.style.top = "50%";
    }

    // Animate transform
    videoRef.current.style.transform = getProportionalValue(
      scrollTop,
      breakpoints.rotateX
    );
    // Animate maxWidth
    videoRef.current.style.maxWidth = getProportionalValue(
      scrollTop,
      dynamicBreakpoints.maxWidth
    );
    // Animate opacity
    videoRef.current.style.opacity = getProportionalValue(
      scrollTop,
      breakpoints.opacity
    );
    // Animate linear gradient background's opacity
    gradient.style.opacity = getProportionalValue(
      scrollTop,
      breakpoints.gradientOpacity
    );
    // Animate figure's aspect ratio
    figure.style.paddingBottom = getProportionalValue(
      scrollTop,
      breakpoints.aspectRatio
    );
  }, [videoRef.current, phoneRef.current, videoContainerRef.current]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
      }}>
      <Guides backgroundColor="white" />
      <Container>
        <Box
          css={{
            width: "100%",
            mb: "$4",
            maxWidth: 1000,
            mx: "auto",
            pt: 48,
            textAlign: "center",
            "@bp2": {
              pt: 100,
            },
          }}>
          <Box css={{ zIndex: notchZIndex + 1, position: "relative" }}>
            <Box
              as="h2"
              css={{
                fontSize: 40,
                lineHeight: 1.2,
                mb: "$7",
                "@bp1": {
                  fontSize: 52,
                  lineHeight: 1.2,
                },
                "@bp2": {
                  fontSize: 72,
                  lineHeight: 1.2,
                },
              }}>
              <Box>
                <Box as="span" css={{ fontWeight: 400 }}>
                  The platform built to power
                </Box>
                <br />
                video-centric UGC applications at scale.
              </Box>
            </Box>
            <Box
              as="form"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/register?email=${encodeURIComponent(email)}`);
              }}
              css={{ mt: 5, px: "$3" }}>
              <Flex
                css={{
                  flexDirection: "column",
                  justifyContent: "center",
                  width: "100%",
                  alignItems: "center",
                  "@bp2": {
                    flexDirection: "row",
                  },
                }}>
                <TextField
                  required
                  type="email"
                  value={email}
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                  css={{
                    fontSize: "$3",
                    py: "$5",
                    px: "$4",
                    borderRadius: 10,
                    width: "100%",
                    mb: "$3",
                    "@bp2": {
                      mb: 0,
                      width: "320px",
                    },
                  }}
                />
                <Button
                  arrow
                  type="submit"
                  css={{
                    height: "48px",
                    fontWeight: 600,
                    ml: 0,
                    px: "$4",
                    width: "100%",
                    "@bp2": {
                      ml: "$3",
                      width: "unset",
                    },
                  }}>
                  Get started
                </Button>
              </Flex>
            </Box>
          </Box>
          <Box
            css={{
              mb: "$6",
              mt: -40,
              position: "relative",
              height: maxScroll,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              display: "none",
              "@bp2": {
                mt: "$4",
                display: "flex",
              },
              "@bp3": {
                mt: null,
              },
              "@bp4": {
                mt: "$6",
              },
            }}>
            <Box
              ref={videoContainerRef}
              css={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100vw",
                zIndex: notchZIndex - 1,
              }}>
              <HeroVideo ref={videoRef} />
            </Box>
            <PhoneSvg ref={phoneRef} />
          </Box>
          <Box css={{ px: "$3", position: "relative", mt: 100, mb: 120 }}>
            <Box
              as="h3"
              css={{
                fontWeight: 700,
                fontSize: 32,
                mb: "$5",
                "@bp2": {
                  fontSize: 48,
                },
              }}>
              Reliable, affordable, high-quality streaming for all of your video
              content.
            </Box>
            <Text variant="gray" size="4" css={{ lineHeight: 1.7 }}>
              By leveraging decentralized infrastructure, Livepeer.com delivers
              a video platform that focuses on what user-generated content (UGC)
              applications need. Affordable, scalable, and reliable, the
              Livepeer.com platform combines high-quality transcoding with
              powerful APIs and features that are essential for a seamless
              creator experience.
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomeHero;
