/** @jsx jsx */
import { jsx } from "theme-ui";
import { Styled } from "theme-ui";
import { Flex, Container, Box } from "@theme-ui/components";
import Textfield from "../Textfield";
import Button from "../Button";
import HeroVideo from "./Video";
import { Text } from "@theme-ui/components";
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
import { Heading } from "@theme-ui/components";

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
      sx={{
        mt: [3, 3, 4, 0],
        overflow: "hidden",
        pt: 6,
        pb: "65px",
      }}>
      <Container
        sx={{
          minHeight: ["auto", "auto", "calc(100vh - 130px)"],
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: [3, null, 0],
        }}>
        <Box
          sx={{
            width: "100%",
            mb: [4, 4, 4, 0],
            maxWidth: 1000,
            mx: "auto",
            textAlign: "center",
          }}>
          <div sx={{ zIndex: notchZIndex + 1, position: "relative" }}>
            <Styled.h1 sx={{ fontSize: [40, 56, 64, 72] }}>
              <span sx={{ fontWeight: 400 }}>The platform built to power</span>
              <br />
              video-centric UGC applications at scale.
            </Styled.h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/register?email=${encodeURIComponent(email)}`);
              }}
              sx={{ mt: 5 }}>
              <Flex
                sx={{
                  flexDirection: ["column", "row"],
                  justifyContent: "center",
                  width: "100%",
                  alignItems: "center",
                }}>
                <Textfield
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="Enter your email"
                  sx={{ width: ["100%", "320px"] }}
                />
                <Button
                  type="submit"
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "55px",
                    ml: [0, 3],
                    mt: [3, 0],
                    width: ["100%", "unset"],
                  }}>
                  Get Started
                </Button>
              </Flex>
            </form>
          </div>
          <div
            sx={{
              mb: 6,
              mt: [-6, 4, null, 6],
              position: "relative",
              height: maxScroll,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
            }}>
            <div
              ref={videoContainerRef}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100vw",
                zIndex: notchZIndex - 1,
              }}>
              <HeroVideo ref={videoRef} />
            </div>
            <PhoneSvg ref={phoneRef} />
          </div>
          <div sx={{ my: 6 }}>
            <Heading variant="heading.section" sx={{ mb: 4, lineHeight: 1.3 }}>
              Reliable, affordable, high-quality streaming for all of your video
              content.
            </Heading>
            <Text sx={{ fontSize: "18px", lineHeight: 1.7 }}>
              By leveraging decentralized infrastructure, Livepeer.com delivers
              a video platform that focuses on what user-generated content (UGC)
              applications need. Affordable, scalable, and reliable, the
              Livepeer.com platform combines high-quality transcoding with
              powerful APIs and features that are essential for a seamless
              creator experience.
            </Text>
          </div>
        </Box>
      </Container>
    </Box>
  );
};

export default HomeHero;
