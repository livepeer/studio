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
  scrollToEnterPhone,
  maxScroll
} from "./helpers";
import { notchZIndex } from "./PhoneSvg";

const HomeHero = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const videoRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!videoRef.current) return;
    const { scrollTop } = document.documentElement;
    const figure = videoRef.current.querySelector("figure") as HTMLElement;
    const gradient = videoRef.current.querySelector(
      "#background-gradient"
    ) as HTMLDivElement;

    // We have two 'phases' for the bottom:
    if (scrollTop < scrollToEnterPhone) {
      // Animate bottom first phase
      videoRef.current.style.bottom = getProportionalValue(
        scrollTop,
        breakpoints.bottom
      );
    } else {
      // Animate bottom second phase
      videoRef.current.style.bottom = getProportionalValue(
        scrollTop,
        breakpoints.bottomSecondPhase,
        scrollToEnterPhone,
        maxScroll
      );
    }
    // Animation continues...

    // Animate transform
    videoRef.current.style.transform = getProportionalValue(
      scrollTop,
      breakpoints.rotateX
    );
    // Animate maxWidth
    videoRef.current.style.maxWidth = getProportionalValue(
      scrollTop,
      breakpoints.maxWidth
    );
    // Animate linear gradient background's opacity
    gradient.style.opacity = getProportionalValue(
      scrollTop,
      breakpoints.opacity
    );
    // Animate figure's aspect ratio
    figure.style.paddingBottom = getProportionalValue(
      scrollTop,
      breakpoints.aspectRatio
    );
  }, [videoRef.current]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box
      sx={{
        mt: [5, 5, 5, 0],
        overflow: "hidden",
        pt: 6,
        pb: "65px"
      }}
    >
      <Container
        sx={{
          minHeight: ["auto", "auto", "calc(100vh - 130px)"],
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: [3, null, null, 0]
        }}
      >
        <Box
          sx={{
            mb: [4, 4, 4, 0],
            maxWidth: 1000,
            mx: "auto",
            textAlign: "center"
          }}
        >
          <div sx={{ zIndex: notchZIndex + 1, position: "relative" }}>
            <Styled.h1 sx={{ fontSize: [40, 56, 64, 72] }}>
              <span sx={{ fontWeight: 400 }}>The platform built to power</span>
              <br />
              video-centric UGC applications at scale.
            </Styled.h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/register?email=${email}`);
              }}
            >
              <Flex
                sx={{
                  mt: 5,
                  flexDirection: ["column", "row"],
                  justifyContent: "center",
                  width: "100%",
                  alignItems: "center"
                }}
              >
                <Textfield
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="Enter your email"
                  sx={{ width: ["188px", "320px"] }}
                />
                <Button
                  type="submit"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    height: "55px",
                    ml: [0, 3],
                    mt: [3, 0],
                    width: ["184px", "unset"]
                  }}
                >
                  Get Started
                </Button>
              </Flex>
            </form>
          </div>
          <div
            sx={{
              my: 6,
              position: "relative",
              height: maxScroll,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end"
            }}
          >
            <HeroVideo ref={videoRef} />
            <PhoneSvg />
          </div>
          <div sx={{ my: 6 }}>
            <Styled.h2 sx={{ mb: 4, lineHeight: 1.3 }}>
              Reliable, affordable, high-quality streaming for all of your video
              content.
            </Styled.h2>
            <Text sx={{ fontSize: "18px", lineHeight: 1.7 }}>
              By leveraging decentralized infrastructure, Livepeer delivers a
              video platform that focuses on what user-generated content (UGC)
              applications need. Affordable, scalable and reliable, the Livepeer
              platform combines high-quality transcoding with powerful APIs and
              features that are essential for a seamless creator experience.
            </Text>
          </div>
        </Box>
      </Container>
    </Box>
  );
};

export default HomeHero;
