import {
  Link as A,
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
import Link from "next/link";
import ArrowLink from "components/Redesign/ArrowLink";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

const HomeHero = ({ backgroundColor = "$loContrast" }) => {
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
      <Guides backgroundColor={backgroundColor} />
      <Container>
        <Box
          css={{
            width: "100%",
            mb: "$4",
            maxWidth: 800,
            mx: "auto",
            pt: 48,
            textAlign: "center",
            "@bp2": {
              pt: 90,
            },
          }}>
          <Box
            css={{
              zIndex: notchZIndex + 1,
              position: "relative",
            }}>
            <Box
              as="h2"
              css={{
                color: "$hiContrast",
                fontSize: 40,
                lineHeight: 1.1,
                mb: "$6",
                mt: 0,
                mx: "auto",
                maxWidth: 700,
                fontWeight: 700,
                "@bp1": {
                  fontSize: 52,
                  lineHeight: 1.1,
                },
                "@bp2": {
                  fontSize: 72,
                  lineHeight: 1.1,
                },
              }}>
              Video development made easy.
            </Box>
            <Text
              size="5"
              css={{
                lineHeight: 1.6,
                mb: "$7",
                maxWidth: 640,
                mx: "auto",
              }}>
              Livepeer.com provides quick and reliable access to{" "}
              <Box
                href="https://livepeer.org"
                target="_blank"
                as={A}
                css={{
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none !important",
                  position: "relative",
                  "&:after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    zIndex: -1,
                    opacity: 1,
                    backgroundClip: "text",
                    background:
                      "linear-gradient(to right, $colors$green8, $colors$green4)",
                    width: "100%",
                    height: "100%",
                    transform: "sk",
                  },
                }}>
                <Text size="5" css={{ lineHeight: 1.2 }}>
                  Livepeer
                </Text>
                <ArrowTopRightIcon />
              </Box>
              , the world's open video infrastructure, allowing you to focus on
              building and scaling next generation video streaming platforms and
              services through a low cost, powerful, and easy-to-use video
              streaming API.
            </Text>
            <Flex align="center" css={{ justifyContent: "center" }}>
              <Link href="/register" passHref>
                <Button as="a" arrow css={{ mr: "$4" }}>
                  Start now
                </Button>
              </Link>
              <ArrowLink href="/contact">Get in touch</ArrowLink>
            </Flex>
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
                color: "$hiContrast",
                "@bp2": {
                  fontSize: 48,
                },
              }}>
              Reliable, affordable, high-quality streaming for all of your video
              content.
            </Box>
            <Text variant="gray" size="4" css={{ lineHeight: 1.7 }}>
              By leveraging the decentralized Livepeer network, Livepeer.com
              delivers a video streaming API that focuses on what user-generated
              content (UGC) applications need. Highly affordable, scalable, and
              reliable, the Livepeer.com API combines high-quality transcoding
              with features essential for building streaming platform
              experiences.
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomeHero;
