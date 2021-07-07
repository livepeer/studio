/** @jsx jsx */
import { jsx } from "theme-ui";
import PricingCard, { PricingCardContent } from "./pricingCard";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { useState } from "react";
import { Box } from "@theme-ui/components";

const slides = [0, 1, 2];

const MobileContainer = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    slidesPerView: 2,
    duration: 400,
    spacing: 16,
    initial: 0,
    breakpoints: {
      "(max-width: 700px)": {
        slidesPerView: 1.8,
      },
      "(max-width: 550px)": {
        slidesPerView: 1.6,
      },
      "(max-width: 450px)": {
        slidesPerView: 1.2,
      },
    },
    slideChanged(s) {
      setCurrentSlide(s.details().relativeSlide);
    },
  });

  return (
    <Box
      sx={{
        display: ["flex", null, null, "none"],
        flexDirection: "column",
        mt: "72px",
        width: "100%",
      }}>
      <Box
        className="keen-slider"
        ref={sliderRef}
        sx={{
          width: "100%",
          display: "flex",
        }}>
        <PricingCard
          className="keen-slider__slide"
          pricingTitle="Personal"
          pricingDescription="Free"
          cardBg="linear-gradient(180deg, #FAFAFA 0%, #FAFAFA 100%)"
          titleColor="black"
          btn={{
            display: "Sign up",
            href: "",
            color: "white",
            bg: "#943CFF",
          }}>
          <Box sx={{ mt: "20px" }}>
            <PricingCardContent>
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Transcoding
              </Box>
              <Box
                as="h1"
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                1000
              </Box>
              <Box
                as="p"
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                minutes/month
              </Box>
            </PricingCardContent>
            <PricingCardContent comingSoon>
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Recording Storage
              </Box>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Stream Delivery via CDN*
              </Box>
              <Box
                as="h1"
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                10
              </Box>
              <Box
                as="p"
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                current viewers
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>
        <PricingCard
          className="keen-slider__slide"
          pricingTitle="Pro"
          pricingDescription="Pay as you go"
          cardBg="#943CFF"
          btn={{
            display: "Sign up",
            href: "/register?selectedPlan=1",
          }}>
          <Box sx={{ mt: "20px" }}>
            <PricingCardContent color="white">
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Transcoding
              </Box>
              <Box
                as="h1"
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                $0.005
                <Box
                  as="span"
                  sx={{
                    fontSize: "16px",
                    letterSpacing: "-0.04em",
                    fontWeight: "normal",
                    ml: "4px",
                  }}>
                  USD
                </Box>
              </Box>
              <Box
                as="p"
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                / min video ingested
              </Box>
            </PricingCardContent>
            <PricingCardContent comingSoon color="white">
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Recording Storage
              </Box>
            </PricingCardContent>
            <PricingCardContent color="white">
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Stream Delivery via CDN*
              </Box>
              <Box
                as="h1"
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                $0.01
                <Box
                  sx={{
                    fontSize: "16px",
                    letterSpacing: "-0.04em",
                    fontWeight: "normal",
                    ml: "4px",
                  }}>
                  USD
                </Box>
              </Box>
              <Box
                as="p"
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                / GB video streamed
              </Box>
              <Box
                as="p"
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                  mt: "10px",
                }}>
                * coming soon
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>
        <PricingCard
          className="keen-slider__slide"
          pricingTitle="Business"
          pricingDescription="Custom pricing"
          cardBg="#3B375A"
          btn={{
            display: "Contact us",
            href: "",
            color: "white",
            bg: "#943CFF",
          }}>
          <Box sx={{ mt: "20px" }}>
            <PricingCardContent color="white" customPricing>
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Transcoding
              </Box>
            </PricingCardContent>
            <PricingCardContent comingSoon color="white">
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Recording Storage
              </Box>
            </PricingCardContent>
            <PricingCardContent color="white" customPricing>
              <Box
                as="p"
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Stream Delivery via CDN*
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mt: "30px",
          alignSelf: "center",
        }}>
        {slides.map((slide) => (
          <Box
            key={slide}
            onClick={() => {
              slider.moveToSlide(slide);
              setCurrentSlide(slide);
            }}
            sx={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: currentSlide === slide ? "#943CFF" : "#CCCCCC",
              mr: "15px",
              ":last-child": {
                mr: "0",
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const DesktopContainer = () => {
  return (
    <Box
      sx={{
        display: ["none", null, null, "grid"],
        gridTemplateColumns: ["repeat(3, 1fr)", null, null, "repeat(4, 1fr)"],
        mt: "72px",
        gap: ["32px", "16px", "20px", "32px"],
        width: "100%",
      }}>
      <Box
        sx={{
          alignSelf: "flex-end",
          display: ["none", null, null, "flex"],
          flexDirection: "column",
        }}>
        <Box as="p" sx={{ color: "#525252", fontSize: "16px", mb: "16px" }}>
          Usage
        </Box>
        <PricingCardContent>
          <Box
            as="h1"
            sx={{
              fontSize: "20px",
              fontWeight: "600",
              mb: "4px",
              letterSpacing: "-0.04em",
            }}>
            Transcoding
          </Box>
          <Box
            as="p"
            sx={{
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525252",
              letterSpacing: "-0.04em",
            }}>
            Livepeer.com creates multiple versions of your source livestream for
            different devices in real time.
          </Box>
        </PricingCardContent>
        <PricingCardContent>
          <Box
            as="h1"
            sx={{
              fontSize: "20px",
              fontWeight: "600",
              mb: "4px",
              letterSpacing: "-0.04em",
            }}>
            Recording Storage
          </Box>
          <Box
            as="p"
            sx={{
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525252",
              letterSpacing: "-0.04em",
            }}>
            Livepeer.com can automatically store your transcoded renditions for
            VoD playback.
          </Box>
        </PricingCardContent>
        <PricingCardContent>
          <Box
            as="h1"
            sx={{
              fontSize: "20px",
              fontWeight: "600",
              mb: "4px",
              letterSpacing: "-0.04em",
            }}>
            Stream Delivery via CDN*
          </Box>
          <Box
            as="p"
            sx={{
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525252",
              letterSpacing: "-0.04em",
            }}>
            Livepeer.com optimizes playback for your viewers across the globe
            via a CDN.
          </Box>
        </PricingCardContent>
      </Box>
      <PricingCard
        pricingTitle="Personal"
        pricingDescription="Free"
        cardBg="linear-gradient(180deg, #FAFAFA 0%, #FAFAFA 100%)"
        titleColor="black"
        btn={{
          display: "Sign up",
          href: "/register",
          color: "white",
          bg: "#943CFF",
        }}>
        <Box sx={{ mt: "20px" }}>
          <PricingCardContent>
            <Box
              as="h1"
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              1000
            </Box>
            <Box
              as="p"
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              minutes/month
            </Box>
          </PricingCardContent>
          <PricingCardContent comingSoon />
          <PricingCardContent>
            <Box
              as="h1"
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              10
            </Box>
            <Box
              as="p"
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              current viewers
            </Box>
          </PricingCardContent>
        </Box>
      </PricingCard>
      <PricingCard
        pricingTitle="Pro"
        pricingDescription="Pay as you go"
        cardBg="#943CFF"
        btn={{
          display: "Sign up",
          href: "",
        }}>
        <Box sx={{ mt: "20px" }}>
          <PricingCardContent color="white">
            <Box
              as="h1"
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              $0.005
              <Box
                as="span"
                sx={{
                  fontSize: "16px",
                  letterSpacing: "-0.04em",
                  fontWeight: "normal",
                  ml: "4px",
                }}>
                USD
              </Box>
            </Box>
            <Box
              as="p"
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              / min video ingested
            </Box>
          </PricingCardContent>
          <PricingCardContent comingSoon color="white" />
          <PricingCardContent color="white">
            <Box
              as="h1"
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              $0.01
              <Box
                as="span"
                sx={{
                  fontSize: "16px",
                  letterSpacing: "-0.04em",
                  fontWeight: "normal",
                  ml: "4px",
                }}>
                USD
              </Box>
            </Box>
            <Box
              as="p"
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              / GB video streamed
            </Box>
            <Box
              as="p"
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
                mt: "10px",
              }}>
              * coming soon
            </Box>
          </PricingCardContent>
        </Box>
      </PricingCard>
      <PricingCard
        pricingTitle="Business"
        pricingDescription="Custom pricing"
        cardBg="#3B375A"
        btn={{
          display: "Contact us",
          href:
            "/contact?utm_source=livepeer.com&utm_medium=internal_page&utm_campaign=business_plan",
          color: "white",
          bg: "#943CFF",
        }}>
        <Box sx={{ mt: "20px" }}>
          <PricingCardContent color="white" customPricing />
          <PricingCardContent comingSoon color="white" />
          <PricingCardContent color="white" customPricing />
        </Box>
      </PricingCard>
    </Box>
  );
};

const PricingCardsContainer = () => {
  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <DesktopContainer />
      <MobileContainer />
      <Box
        as="p"
        sx={{
          color: "#525252",
          fontSize: "12px",
          lineHeight: "1.6",
          fontStyle: "italic",
          textAlign: "center",
          alignSelf: "center",
          mt: "64px",
        }}>
        Currently, we are not charging for Stream Delivery via CDN. We’ll be
        sure to reach out before we start to do so. <br /> Thanks for streaming
        with Livepeer.com.
      </Box>
    </Box>
  );
};

export default PricingCardsContainer;
