import PricingCard, { PricingCardContent } from "./pricingCard";
import "keen-slider/keen-slider.min.css";
import useApi from "hooks/use-api";
import { useKeenSlider } from "keen-slider/react";
import { useState } from "react";
import { Router, useRouter } from "next/router";

type Props = {
  inApp?: boolean;
  setModal?: React.Dispatch<React.SetStateAction<boolean>>;
};

const slides = [0, 1, 2];

const MobileContainer = ({ inApp, setModal }: Props) => {
  const { user } = useApi();
  const router = useRouter();
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
    <div
      sx={{
        display: ["flex", null, null, "none"],
        flexDirection: "column",
        mt: "72px",
        width: "100%",
      }}>
      <div
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
            display: inApp
              ? user.stripeProductId === "prod_0"
                ? "Current plan"
                : "Downgrade"
              : "Sign up",
            onClick: () => {
              if (inApp) {
                setModal(true);
              } else {
                router.push("/register");
              }
            },
            disabled: inApp && user.stripeProductId === "prod_0" ? true : false,
            color: "white",
            bg: "#943CFF",
          }}>
          <div sx={{ mt: "20px" }}>
            <PricingCardContent>
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Transcoding
              </p>
              <h1
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                1000
              </h1>
              <p
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                minutes/month
              </p>
            </PricingCardContent>
            <PricingCardContent comingSoon>
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Recording Storage
              </p>
            </PricingCardContent>
            <PricingCardContent>
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Stream Delivery via CDN*
              </p>
              <h1
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                10
              </h1>
              <p
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                current viewers
              </p>
            </PricingCardContent>
          </div>
        </PricingCard>
        <PricingCard
          className="keen-slider__slide"
          pricingTitle="Pro"
          pricingDescription="Pay as you go"
          cardBg="#943CFF"
          btn={{
            display: inApp
              ? user.stripeProductId === "prod_1"
                ? "Current plan"
                : user.stripeProductId === "prod_2"
                ? "Downgrade"
                : "Upgrade"
              : "Sign up",
            onClick: () => {
              if (inApp) {
                setModal(true);
              } else {
                router.push("/register?selectedPlan=1");
              }
            },
          }}>
          <div sx={{ mt: "20px" }}>
            <PricingCardContent color="white">
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Transcoding
              </p>
              <h1
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                $0.005
                <span
                  sx={{
                    fontSize: "16px",
                    letterSpacing: "-0.04em",
                    fontWeight: "normal",
                    ml: "4px",
                  }}>
                  USD
                </span>
              </h1>
              <p
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                / min video ingested
              </p>
            </PricingCardContent>
            <PricingCardContent comingSoon color="white">
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Recording Storage
              </p>
            </PricingCardContent>
            <PricingCardContent color="white">
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Stream Delivery via CDN*
              </p>
              <h1
                sx={{
                  fontSize: "32px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                $0.01
                <span
                  sx={{
                    fontSize: "16px",
                    letterSpacing: "-0.04em",
                    fontWeight: "normal",
                    ml: "4px",
                  }}>
                  USD
                </span>
              </h1>
              <p
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                }}>
                / GB video streamed
              </p>
              <p
                sx={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  letterSpacing: "-0.04em",
                  mt: "10px",
                }}>
                * coming soon
              </p>
            </PricingCardContent>
          </div>
        </PricingCard>
        <PricingCard
          className="keen-slider__slide"
          pricingTitle="Business"
          pricingDescription="Custom pricing"
          cardBg="#3B375A"
          btn={{
            display: inApp
              ? user.stripeProductId === "prod_2"
                ? "Current plan"
                : "Contact us"
              : "Contact us",
            onClick: () =>
              router.push(
                "/contact?utm_source=livepeer.com&utm_medium=internal_page&utm_campaign=business_plan"
              ),
            color: "white",
            bg: "#943CFF",
          }}>
          <div sx={{ mt: "20px" }}>
            <PricingCardContent color="white" customPricing>
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Transcoding
              </p>
            </PricingCardContent>
            <PricingCardContent comingSoon color="white">
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Recording Storage
              </p>
            </PricingCardContent>
            <PricingCardContent color="white" customPricing>
              <p
                sx={{
                  fontSize: "20px",
                  fontWeight: "600",
                  letterSpacing: "-0.04em",
                }}>
                Stream Delivery via CDN*
              </p>
            </PricingCardContent>
          </div>
        </PricingCard>
      </div>
      <div
        sx={{
          display: "flex",
          alignItems: "center",
          mt: "30px",
          alignSelf: "center",
        }}>
        {slides.map((slide) => (
          <div
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
      </div>
    </div>
  );
};

const DesktopContainer = ({ inApp, setModal }: Props) => {
  const { user } = useApi();
  const router = useRouter();
  return (
    <div
      sx={{
        display: ["none", null, null, "grid"],
        gridTemplateColumns: ["repeat(3, 1fr)", null, null, "repeat(4, 1fr)"],
        mt: "72px",
        gap: ["32px", "16px", "20px", "32px"],
        width: "100%",
      }}>
      <div
        sx={{
          alignSelf: "flex-end",
          display: ["none", null, null, "flex"],
          flexDirection: "column",
        }}>
        <p sx={{ color: "#525252", fontSize: "16px", mb: "16px" }}>Usage</p>
        <PricingCardContent>
          <h1
            sx={{
              fontSize: "20px",
              fontWeight: "600",
              mb: "4px",
              letterSpacing: "-0.04em",
            }}>
            Transcoding
          </h1>
          <p
            sx={{
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525252",
              letterSpacing: "-0.04em",
            }}>
            Livepeer.com creates multiple versions of your source livestream for
            different devices in real time.
          </p>
        </PricingCardContent>
        <PricingCardContent>
          <h1
            sx={{
              fontSize: "20px",
              fontWeight: "600",
              mb: "4px",
              letterSpacing: "-0.04em",
            }}>
            Recording Storage
          </h1>
          <p
            sx={{
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525252",
              letterSpacing: "-0.04em",
            }}>
            Livepeer.com can automatically store your transcoded renditions for
            VoD playback.
          </p>
        </PricingCardContent>
        <PricingCardContent>
          <h1
            sx={{
              fontSize: "20px",
              fontWeight: "600",
              mb: "4px",
              letterSpacing: "-0.04em",
            }}>
            Stream Delivery via CDN*
          </h1>
          <p
            sx={{
              fontSize: "12px",
              lineHeight: "18px",
              color: "#525252",
              letterSpacing: "-0.04em",
            }}>
            Livepeer.com optimizes playback for your viewers across the globe
            via a CDN.
          </p>
        </PricingCardContent>
      </div>
      <PricingCard
        pricingTitle="Personal"
        pricingDescription="Free"
        cardBg="linear-gradient(180deg, #FAFAFA 0%, #FAFAFA 100%)"
        titleColor="black"
        btn={{
          display: inApp
            ? user.stripeProductId === "prod_0"
              ? "Current plan"
              : "Downgrade"
            : "Sign up",
          onClick: () => {
            if (inApp) {
              setModal(true);
            } else {
              router.push("/register");
            }
          },
          disabled: inApp && user.stripeProductId === "prod_0" ? true : false,
          color: "white",
          bg: "#943CFF",
        }}>
        <div sx={{ mt: "20px" }}>
          <PricingCardContent>
            <h1
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              1000
            </h1>
            <p
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              minutes/month
            </p>
          </PricingCardContent>
          <PricingCardContent comingSoon />
          <PricingCardContent>
            <h1
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              10
            </h1>
            <p
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              current viewers
            </p>
          </PricingCardContent>
        </div>
      </PricingCard>
      <PricingCard
        pricingTitle="Pro"
        pricingDescription="Pay as you go"
        cardBg="#943CFF"
        btn={{
          display: inApp
            ? user.stripeProductId === "prod_1"
              ? "Current plan"
              : user.stripeProductId === "prod_2"
              ? "Downgrade"
              : "Upgrade"
            : "Sign up",
          onClick: () => {
            if (inApp) {
              setModal(true);
            } else {
              router.push("/register?selectedPlan=1");
            }
          },
        }}>
        <div sx={{ mt: "20px" }}>
          <PricingCardContent color="white">
            <h1
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              $0.005
              <span
                sx={{
                  fontSize: "16px",
                  letterSpacing: "-0.04em",
                  fontWeight: "normal",
                  ml: "4px",
                }}>
                USD
              </span>
            </h1>
            <p
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              / min video ingested
            </p>
          </PricingCardContent>
          <PricingCardContent comingSoon color="white" />
          <PricingCardContent color="white">
            <h1
              sx={{
                fontSize: "32px",
                fontWeight: "600",
                letterSpacing: "-0.04em",
              }}>
              $0.01
              <span
                sx={{
                  fontSize: "16px",
                  letterSpacing: "-0.04em",
                  fontWeight: "normal",
                  ml: "4px",
                }}>
                USD
              </span>
            </h1>
            <p
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
              }}>
              / GB video streamed
            </p>
            <p
              sx={{
                fontSize: "16px",
                lineHeight: "24px",
                letterSpacing: "-0.04em",
                mt: "10px",
              }}>
              * coming soon
            </p>
          </PricingCardContent>
        </div>
      </PricingCard>
      <PricingCard
        pricingTitle="Business"
        pricingDescription="Custom pricing"
        cardBg="#3B375A"
        btn={{
          display: inApp
            ? user.stripeProductId === "prod_2"
              ? "Current plan"
              : "Contact us"
            : "Contact us",
          onClick: () =>
            router.push(
              "/contact?utm_source=livepeer.com&utm_medium=internal_page&utm_campaign=business_plan"
            ),
          color: "white",
          bg: "#943CFF",
        }}>
        <div sx={{ mt: "20px" }}>
          <PricingCardContent color="white" customPricing />
          <PricingCardContent comingSoon color="white" />
          <PricingCardContent color="white" customPricing />
        </div>
      </PricingCard>
    </div>
  );
};

const PricingCardsContainer = ({ inApp, setModal }: Props) => {
  return (
    <div sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <DesktopContainer inApp={inApp} setModal={setModal} />
      <MobileContainer inApp={inApp} setModal={setModal} />
      <p
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
      </p>
    </div>
  );
};

export default PricingCardsContainer;
