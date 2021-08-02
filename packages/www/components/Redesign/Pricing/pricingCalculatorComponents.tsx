import { ReactNode, useCallback } from "react";
import { useApi } from "hooks";
import { Box, Grid, Flex, Text, TextField } from "@livepeer.com/design-system";
import Button from "components/Redesign/Button";
import { useRouter } from "next/router";

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
      e.target.style.background = `linear-gradient(to right, #6e56cf ${realValue}%, #E1E1E1 0%)`;
    },
    [value, min, max]
  );

  return (
    <Box
      css={{
        borderTop: "1px solid $colors$mauve5",
        py: "32px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
      <Text
        size="5"
        css={{
          color: "$hiContrast",
          mb: "$4",
        }}>
        {title}
      </Text>
      <Grid
        gap={4}
        css={{
          gridTemplateColumns: "repeat(1,1fr)",
          alignItems: "center",
          "@bp2": {
            gridTemplateColumns: "repeat(2,1fr)",
          },
        }}>
        {children}
        <Box
          as="input"
          min={min}
          max={max}
          value={value}
          onInput={handleInput}
          onChange={handleChange}
          type="range"
          step={step}
          css={{
            outline: "none",
            height: 2,
            width: "100%",
            appearance: "none",
            bc: "$hiContrast",
            "&::-webkit-slider-thumb": {
              appearance: "none",
              width: 16,
              height: 16,
              borderRadius: "12px",
              bc: "$violet9",
              cursor: "grabbing",
            },
          }}
        />
      </Grid>
    </Box>
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
    <Flex
      as="button"
      aria-label={`${value} Percentage Watched`}
      onClick={handleClick}
      css={{
        height: 56,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid $mauve5",
        bc: "transparent",
        borderColor: percentageWatched === value ? "$violet9" : "$mauve7",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "$violet9",
        },
      }}>
      <Box
        css={{
          fontSize: "14px",
          color: percentageWatched === value ? "$violet9" : "$mauve9",
          fontWeight: percentageWatched === value ? 600 : 400,
        }}>
        {value}%
      </Box>
    </Flex>
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
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        pt: "32px",
        width: "100%",
      }}>
      <Text
        size="4"
        css={{
          mb: "$2",
        }}>
        Usage
      </Text>
      <CalculatorItem
        title="Average length of stream"
        marginTop="-26px"
        setValue={setStreamLength}
        min={0}
        max={43200}
        step={900}
        value={streamLength}>
        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}>
          <Box
            css={{
              height: 48,
              width: "100%",
              maxWidth: "100%",
              borderRadius: "6px",
              border: "1px solid $colors$mauve5",
              fontSize: "20px",
              letterSpacing: "-0.02em",
              display: "flex",
              bc: "$panel",
              justifyContent: "space-between",
              alignItems: "center",
              px: "16px",
              transition: "all 0.2s",
              "::placeholder": {
                color: "$mauve9",
              },
              "@bp2": {
                width: 250,
              },
            }}>
            <TextField
              maxLength={2}
              name="hours"
              onChange={handleChange}
              value={streamLengthDividedTime.hours}
              placeholder="00"
              css={{
                width: 50,
                display: "flex",
                justifyContent: "center",
                px: "$2",
                borderRadius: "6px",
              }}
            />
            <Box css={{ color: "$mauve9" }}>:</Box>
            <TextField
              maxLength={2}
              name="minutes"
              onChange={handleChange}
              value={streamLengthDividedTime.minutes}
              placeholder="00"
              css={{
                width: 50,
                display: "flex",
                justifyContent: "center",
                px: "$2",
                borderRadius: "6px",
              }}
            />
            <Box css={{ color: "$mauve9" }}>:</Box>
            <TextField
              maxLength={2}
              name="seconds"
              onChange={handleChange}
              value={streamLengthDividedTime.seconds}
              placeholder="00"
              css={{
                width: 50,
                display: "flex",
                justifyContent: "center",
                px: "$2",
                borderRadius: "6px",
              }}
            />
          </Box>
          <Box
            css={{
              display: "flex",
              justifyContent: "space-between",
              mt: "$1",
              px: "$4",
              width: "100%",
            }}>
            <Text variant="gray" size="1">
              hours
            </Text>
            <Text variant="gray" size="1">
              minutes
            </Text>
            <Text variant="gray" size="1">
              seconds
            </Text>
          </Box>
        </Box>
      </CalculatorItem>
      <CalculatorItem
        title="Monthly live streams"
        setValue={setMonthlyStreams}
        min={0}
        max={10000}
        step={50}
        value={monthlyStreams}>
        <TextField
          size="3"
          value={monthlyStreams}
          maxLength={6}
          onChange={(e) => {
            const monthly = parseFloat(e.target.value);
            setMonthlyStreams(monthly > 0 ? monthly : 0);
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
        <TextField
          size="3"
          value={viewCount}
          placeholder="0"
          maxLength={8}
          onChange={(e) => {
            const view = parseFloat(e.target.value);
            setViewCount(view > 0 ? view : 0);
          }}
        />
      </CalculatorItem>
      <Box
        css={{
          borderTop: "1px solid $colors$mauve5",
          pt: "32px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
        <Text
          size="5"
          css={{
            mb: "24px",
          }}>
          What percentage of the stream does the average viewer watch?
        </Text>
        <Grid
          gap={3}
          css={{
            gridTemplateColumns: "repeat(4, 1fr)",
          }}>
          {scaleCalculatorValues.map((each, idx) => (
            <ScaleCalculator
              key={idx}
              value={each}
              percentageWatched={percentageWatched}
              setPercentageWatched={setPercentageWatched}
            />
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

const PreviewItem = ({
  title,
  description,
  value,
  valueClarification,
  children,
}: PreviewItemProps) => {
  return (
    <Box
      css={{
        borderTop: "1px solid $colors$mauve5",
        minHeight: 104,
        pt: "$5",
        pb: "$3",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "@bp2": {
          pb: "$5",
          pt: "$7",
          minHeight: 136,
          flexDirection: "row",
          alignItems: "center",
        },
      }}>
      <Box
        css={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          maxWidth: 244,
          mb: "$4",
          position: "relative",
          "@bp2": {
            mr: "$4",
            mb: 0,
          },
        }}>
        <Box css={{ display: "flex", flexDirection: "column", mb: "$3" }}>
          <Text
            size="5"
            css={{
              minWidth: "fit-content",
              color: "$hiContrast",
            }}>
            {title}
          </Text>
        </Box>
        <Text variant="gray" size="2">
          {description}
        </Text>
      </Box>

      <Box
        css={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "flex-start",
          "@bp2": {
            alignItems: "flex-end",
          },
        }}>
        <Text
          size="7"
          css={{
            fontWeight: 600,
            color: "$hiContrast",
          }}>
          {value}
        </Text>
        <Box
          css={{
            fontSize: "16px",
            lineHeight: "24px",
            alignSelf: "flex-end",
            textAlign: "right",
          }}>
          {valueClarification}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

const Preview = ({ transcoding, streaming }: PreviewProps) => {
  const totalValue = parseFloat((transcoding + streaming).toFixed(2));
  const { token } = useApi();
  const router = useRouter();

  return (
    <Box
      css={{
        border: "1px solid $colors$mauve5",
        boxSizing: "border-box",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        padding: "32px",
        width: "100%",
        bc: "$loContrast",
      }}>
      <Box
        css={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          pb: "$2",
        }}>
        <Text size="4">Monthly cost</Text>
        <Text size="3" variant="gray" css={{ fontStyle: "italic" }}>
          Prices listed in USD
        </Text>
      </Box>
      <PreviewItem
        title="Transcoding"
        description="Create multiple versions of your source stream for different devices in real time."
        value={totalValue > 3000 ? "Contact us" : `$${transcoding.toFixed(2)}`}
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}
      />
      <PreviewItem
        title="Stream Delivery via CDN"
        description="Optimize playback for your viewers across the globe via a CDN. Delivery via CDN is currently free. We will charge for it in the future."
        value={totalValue > 3000 ? "Contact us" : `$${streaming.toFixed(2)}`}
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}
        valueClarification="*coming soon"
      />
      <PreviewItem
        title="Recording Storage"
        description="Automatically store your transcoded renditions for VoD playback. Storage is currently free. We will charge for it in the future."
        value={transcoding + streaming > 3000 ? "Contact us" : "Coming Soon"}
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}
      />
      <PreviewItem
        title="Total cost"
        description="Transcoding + streaming via CDN"
        value={totalValue > 3000 ? "Contact us" : `$${totalValue}`}
        valueClarification={
          totalValue > 3000
            ? ""
            : `$${transcoding.toFixed(2)} + $${streaming.toFixed(2)}`
        }
        color={totalValue > 3000 ? "rgba(0, 0, 0, 0.2)" : "black"}
      />
      {transcoding + streaming > 500 && (
        <Text size="3" variant="green" css={{ mb: "$4" }}>
          {totalValue > 3000
            ? "Contact us For High Volume Discounts"
            : "High Volume Discounts Available"}
        </Text>
      )}
      <Button
        arrow
        size="4"
        disabled={streaming + transcoding === 0}
        onClick={() => {
          router.push(token ? "/dashboard/billing/plans" : "/register");
        }}>
        {totalValue > 3000 ? "Contact us" : "Get Started"}
      </Button>
    </Box>
  );
};

export { Preview, Calculator };
