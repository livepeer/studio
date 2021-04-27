import { parse } from "graphql";
import { ReactNode, useCallback, useEffect } from "react";

type PreviewItemProps = {
  title: string;
  description?: string;
  value: string;
  valueClarification?: string;
  children?: ReactNode;
  color?: string;
};

type PreviewProps = {
  transcoding: number;
  streaming: number;
};

type CalculatorItemProps = {
  title: string;
  children: ReactNode;
  min: number;
  max: number;
  value?: number | undefined | null;
  setValue?: React.Dispatch<React.SetStateAction<number>>;
  marginTop?: string;
  step?: number;
};

type ScaleCalculatorProps = {
  value: number;
  percentageWatched: number;
  setPercentageWatched: React.Dispatch<React.SetStateAction<number>>;
};

type CalculatorProps = {
  streamLength: number;
  monthlyStreams: number;
  viewCount: number;
  setStreamLength: React.Dispatch<React.SetStateAction<number>>;
  setMonthlyStreams: React.Dispatch<React.SetStateAction<number>>;
  setViewCount: React.Dispatch<React.SetStateAction<number>>;
  percentageWatched: number;
  setPercentageWatched: React.Dispatch<React.SetStateAction<number>>;
};

const scaleCalculatorValues = [25, 50, 75, 100];

const CalculatorItem = ({
  title,
  children,
  max,
  min,
  value,
  setValue,
  marginTop,
  step,
}: CalculatorItemProps) => {
  const handleChange = (e) => {
    const value = e.target.value;
    setValue(parseFloat(value));
  };

  const handleInput = useCallback(
    (e) => {
      const { value, min, max } = e.target;
      const realValue = ((value - min) / (max - min)) * 100;
      e.target.style.background = `linear-gradient(to right, #943CFF ${realValue}%, #E1E1E1 0%)`;
    },
    [value, min, max]
  );

  return (
    <div
      sx={{
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        py: "32px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
      <h1
        sx={{
          mb: "24px",
          fontSize: "20px",
          lineHeight: "24px",
          letterSpacing: "-0.04em",
          fontWeight: "400",
        }}>
        {title}
      </h1>
      <div
        sx={{
          display: "grid",
          gridTemplateColumns: ["1fr", "1fr", "56% 38%", "56% 38%"],
          alignItems: "center",
          gap: ["20px", "20px", "6%", "6%"],
        }}>
        {children}
        <input
          className="pricing__range__input"
          min={min}
          max={max}
          value={value}
          onInput={handleInput}
          onChange={handleChange}
          type="range"
          step={step}
          sx={{
            outline: "none",
            height: "2px",
            width: "100%",
            appearance: "none",
            background: "#E1E1E1",
            mt: ["0", "0", `${marginTop ?? ""}`],
            "::-webkit-slider-thumb": {
              appearance: "none",
              width: ["16px", "12px"],
              height: ["16px", "12px"],
              borderRadius: "12px",
              background: "#943CFF",
              cursor: "grabbing",
            },
          }}
        />
      </div>
    </div>
  );
};

const ScaleCalculator = ({
  value,
  percentageWatched,
  setPercentageWatched,
}: ScaleCalculatorProps) => {
  const handleClick = () => {
    if (percentageWatched === value) {
      setPercentageWatched(0);
    } else {
      setPercentageWatched(value);
    }
  };
  return (
    <button
      aria-label={`${value} Percentage Watched`}
      onClick={handleClick}
      sx={{
        width: ["100%", "96px"],
        height: "56px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #E6E6E6",
        boxSizing: "border-box",
        background: percentageWatched === value ? "#943CFF" : "#FBFBFB",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary",
        },
        "&:focus": {
          outline: "none",
          boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
          borderColor: "primary",
        },
      }}>
      <p
        sx={{
          fontSize: "14px",
          letterSpacing: "-0.04em",
          color: percentageWatched === value ? "white" : "black",
          fontWeight: percentageWatched === value ? "600" : "400",
        }}>
        {value}%
      </p>
    </button>
  );
};

const Calculator = ({
  streamLength,
  monthlyStreams,
  viewCount,
  setStreamLength,
  setMonthlyStreams,
  setViewCount,
  percentageWatched,
  setPercentageWatched,
}: CalculatorProps) => {
  const streamLengthDividedTime = {
    hours: parseFloat((streamLength / 60 / 60).toString().split(".")[0]),
    minutes: parseFloat(((streamLength / 60) % 60).toString().split(".")[0]),
    seconds: streamLength % 60,
  };

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      let seconds = 0;
      switch (name) {
        case "hours":
          seconds =
            streamLengthDividedTime.minutes * 60 +
            streamLengthDividedTime.seconds +
            value * 60 * 60;
          break;
        case "minutes":
          seconds =
            streamLengthDividedTime.hours * 60 * 60 +
            streamLengthDividedTime.seconds +
            value * 60;
          break;
        case "seconds":
          seconds =
            streamLengthDividedTime.hours * 60 * 60 +
            streamLengthDividedTime.minutes * 60 +
            value * 1;
          break;
        default:
          break;
      }
      setStreamLength(seconds > 0 ? seconds : 0);
    },
    [setStreamLength, streamLengthDividedTime, streamLength]
  );

  return (
    <div
      sx={{
        display: "flex",
        flexDirection: "column",
        pt: "32px",
        width: "100%",
      }}>
      <p
        sx={{
          fontSize: "16px",
          lineHeight: "16px",
          letterSpacing: "-0.04em",
          color: "#525252",
          mb: "16px",
        }}>
        Usage
      </p>
      <CalculatorItem
        title="Average length of stream"
        marginTop="-26px"
        setValue={setStreamLength}
        min={0}
        max={43200}
        step={900}
        value={streamLength}>
        <div sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div
            sx={{
              height: "48px",
              width: "100%",
              maxWidth: ["100%", "100%", "276px"],
              borderRadius: "6px",
              border: "1px solid #E6E6E6",
              fontSize: "20px",
              letterSpacing: "-0.02em",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: "16px",
              transition: "all 0.2s",
              "::placeholder": {
                color: "#7D7D7D",
              },
              "&:hover": {
                borderColor: "primary",
              },
            }}>
            <input
              maxLength={2}
              name="hours"
              onChange={handleChange}
              value={streamLengthDividedTime.hours}
              placeholder="00"
              sx={{
                width: "36px",
                display: "flex",
                justifyContent: "center",
                px: "6px",
                transition: "all 0.2s",
                borderRadius: "6px",
                "&:focus": {
                  outline: "none",
                  boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
                },
              }}
            />
            <p sx={{ color: "#7D7D7D" }}>:</p>
            <input
              maxLength={2}
              name="minutes"
              onChange={handleChange}
              value={streamLengthDividedTime.minutes}
              placeholder="00"
              sx={{
                width: "36px",
                display: "flex",
                justifyContent: "center",
                pl: "6px",
                transition: "all 0.2s",
                borderRadius: "6px",
                "&:focus": {
                  outline: "none",
                  boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
                },
              }}
            />
            <p sx={{ color: "#7D7D7D" }}>:</p>
            <input
              maxLength={2}
              name="seconds"
              onChange={handleChange}
              value={streamLengthDividedTime.seconds}
              placeholder="00"
              sx={{
                width: "36px",
                display: "flex",
                justifyContent: "center",
                px: "6px",
                transition: "all 0.2s",
                borderRadius: "6px",
                "&:focus": {
                  outline: "none",
                  boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
                },
              }}
            />
          </div>
          <div
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: "8px",
              px: "16px",
            }}>
            <p
              sx={{
                fontSize: "12px",
                letterSpacing: "-0.04em",
                color: "#525252",
              }}>
              hours
            </p>
            <p
              sx={{
                fontSize: "12px",
                letterSpacing: "-0.04em",
                color: "#525252",
              }}>
              minutes
            </p>
            <p
              sx={{
                fontSize: "12px",
                letterSpacing: "-0.04em",
                color: "#525252",
              }}>
              seconds
            </p>
          </div>
        </div>
      </CalculatorItem>
      <CalculatorItem
        title="Monthly live streams"
        setValue={setMonthlyStreams}
        min={0}
        max={10000}
        step={50}
        value={monthlyStreams}>
        <input
          value={monthlyStreams}
          maxLength={6}
          onChange={(e) => {
            const monthly = parseFloat(e.target.value);
            setMonthlyStreams(monthly > 0 ? monthly : 0);
          }}
          sx={{
            height: "48px",
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #E6E6E6",
            fontSize: "20px",
            letterSpacing: "-0.02em",
            px: "16px",
            color: monthlyStreams == 0 ? "#7D7D7D" : "black",
            transition: "all 0.2s",
            "&:hover": {
              borderColor: "primary",
            },
            "&:focus": {
              outline: "none",
              boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
              borderColor: "primary",
            },
          }}
        />
      </CalculatorItem>
      <CalculatorItem
        title="Number of viewers per stream"
        setValue={setViewCount}
        min={0}
        max={10000}
        step={50}
        value={viewCount}>
        <input
          value={viewCount}
          placeholder="0"
          maxLength={8}
          onChange={(e) => {
            const view = parseFloat(e.target.value);
            setViewCount(view > 0 ? view : 0);
          }}
          sx={{
            height: "48px",
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #E6E6E6",
            fontSize: "20px",
            letterSpacing: "-0.02em",
            px: "16px",
            color: viewCount == 0 ? "#7D7D7D" : "black",
            transition: "all 0.2s",
            "&:hover": {
              borderColor: "primary",
            },
            "&:focus": {
              outline: "none",
              boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
              borderColor: "primary",
            },
          }}
        />
      </CalculatorItem>
      <div
        sx={{
          borderTop: "1px solid rgba(0, 0, 0, 0.08)",
          pt: "32px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
        <h1
          sx={{
            mb: "24px",
            fontSize: "20px",
            lineHeight: "24px",
            letterSpacing: "-0.04em",
            fontWeight: "400",
          }}>
          What percentage of the stream does the average viewer watch?
        </h1>
        <div
          sx={{
            display: ["grid", "flex"],
            gap: ["12px", "16px"],
            gridTemplateColumns: ["repeat(4, 1fr)", null],
          }}>
          {scaleCalculatorValues.map((each, idx) => (
            <ScaleCalculator
              key={idx}
              value={each}
              percentageWatched={percentageWatched}
              setPercentageWatched={setPercentageWatched}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const PreviewItem = ({
  title,
  description,
  value,
  valueClarification,
  children,
  color,
}: PreviewItemProps) => {
  return (
    <div
      sx={{
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        minHeight: ["104px", "136px"],
        pt: ["24px", "48px"],
        pb: ["8px", "32px"],
        width: "100%",
        display: "flex",
        flexDirection: ["column", "column", "row"],
        alignItems: ["flex-start", "flex-start", "center"],
        justifyContent: "space-between",
      }}>
      <div
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          maxWidth: "244px",
          mr: ["0", "0", "15px"],
          mb: ["8px", "8px", "0"],
        }}>
        <div sx={{ display: "flex", flexDirection: "column", mb: "8px" }}>
          <h1
            sx={{
              fontSize: "20px",
              minWidth: "fit-content",
              lineHeight: "24px",
              letterSpacing: "-0.04em",
              fontWeight: "600",
            }}>
            {title}
          </h1>
          {children}
        </div>
        <p
          sx={{
            color: "#525252",
            fontSize: "12px",
            lineHeight: "20px",
            letterSpacing: "-0.04em",
          }}>
          {description}
        </p>
      </div>
      <div
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: ["flex-start", "flex-start", "flex-end", "flex-end"],
        }}>
        <h1
          sx={{
            fontSize: ["24px", "24px", "26px", "32px"],
            lineHeight: "40px",
            letterSpacing: "-0.04em",
            fontWeight: "600",
            textAlign: ["left", "right", "right"],
            color: color ?? "black",
          }}>
          {value}
        </h1>
        <p
          sx={{
            fontSize: "16px",
            lineHeight: "24px",
            letterSpacing: "-0.04em",
            alignSelf: "flex-end",
            textAlign: "right",
          }}>
          {valueClarification}
        </p>
      </div>
    </div>
  );
};

const Preview = ({ transcoding, streaming }: PreviewProps) => {
  const totalValue = parseFloat((transcoding + streaming).toFixed(2));
  return (
    <div
      sx={{
        background: "linear-gradient(180deg, #FAFAFA 0%, #FAFAFA 100%)",
        border: "1px solid #EAEAEA",
        boxSizing: "border-box",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        padding: "32px",
        width: "100%",
      }}>
      <div
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          pb: "16px",
        }}>
        <p
          sx={{
            fontSize: "16px",
            lineHeight: "16px",
            letterSpacing: "-0.04em",
            color: "#525252",
          }}>
          Monthly cost
        </p>
        <p
          sx={{
            fontSize: "12px",
            letterSpacing: "-0.04em",
            color: "#525252",
            fontStyle: "italic",
          }}>
          Prices listed in USD
        </p>
      </div>
      <PreviewItem
        title="Transcoding"
        description="Livepeer.com creates multiple versions of your source livestream for different devices in real time."
        value={totalValue > 3000 ? "Contact us" : `$${transcoding.toFixed(2)}`}
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}
      />
      <PreviewItem
        title="Stream Delivery via CDN"
        description="Livepeer.com optimizes playback for your viewers across the globe via a CDN. Delivery via CDN is currently free. We will charge for it in the future."
        value={totalValue > 3000 ? "Contact us" : `$${streaming.toFixed(2)}`}
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}
        valueClarification='* coming soon'
      />
      <PreviewItem
        title="Recording Storage"
        description="Livepeer.com can automatically store your transcoded renditions for VoD playback. Storage is currently free. We will charge for it in the future."
        value={transcoding + streaming > 3000 ? "Contact us" : "Coming Soon"}
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}
      />
      <PreviewItem
        title="Total cost"
        description="Transcoding + Streaming via CDN"
        value={totalValue > 3000 ? "Contact us" : `$${totalValue}`}
        valueClarification={
          totalValue > 3000
            ? ""
            : `$${transcoding.toFixed(2)} + $${streaming.toFixed(2)}`
        }
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}>
        {transcoding + streaming > 500 && (
          <p
            sx={{
              background: "#00A55F",
              borderRadius: "4px",
              padding: "6px 8px",
              mt: "8px",
              color: "white",
              fontWeight: "600",
              fontSize: "12px",
              letterSpacing: "-0.03em",
              minWidth: "fit-content",
            }}>
            {totalValue > 3000
              ? "Contact us For High Volume Discounts"
              : "High Volume Discounts Available"}
          </p>
        )}
      </PreviewItem>
      <button
        disabled={streaming + transcoding === 0}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "600",
          fontSize: "20px",
          color: "white",
          letterSpacing: "-0.03em",
          height: "56px",
          cursor: streaming + transcoding === 0 ? "not-allowed" : "pointer",
          background: streaming + transcoding === 0 ? "#CCCCCC" : "#943CFF",
          borderRadius: "6px",
          mt: "10px",
          transition: "all 0.2s",
          "&:focus": {
            outline: "none",
            boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
          },
        }}>
        {totalValue > 3000 ? "Contact us" : "Get Started"}
      </button>
    </div>
  );
};

export { Preview, Calculator };
