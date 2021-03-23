import { ReactNode, useState } from "react";

type PreviewItemProps = {
  title: string;
  description?: string;
  value: string;
  valueClarification?: string;
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
};

type ScaleCalculatorProps = {
  value: number;
  isSelected: boolean;
  handleClick?: React.MouseEventHandler<HTMLDivElement>;
};

type CalculatorProps = {
    streamLength: number
    monthlyStreams: number
    viewCount: number
    setStreamLength: React.Dispatch<React.SetStateAction<number>>
    setMonthlyStreams: React.Dispatch<React.SetStateAction<number>>
    setViewCount: React.Dispatch<React.SetStateAction<number>>
}

const scaleCalculatorValues = [25, 50, 75, 100];

const CalculatorItem = ({
  title,
  children,
  max,
  min,
  value,
  setValue,
}: CalculatorItemProps) => {
  const handleChange = (e) => {
    const value = e.target.value;
    setValue(value);
  };
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        {children}
        <input
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          type="range"
          sx={{
            outline: "none",
            height: "2px",
            width: "172px",
            appearance: "none",
            background: "#E1E1E1",
            "::-webkit-slider-thumb": {
              appearance: "none",
              width: "12px",
              height: "12px",
              borderRadius: "12px",
              background: "#943CFF",
            },
            "::-webkit-progress-bar": {
              appearance: "none",
              background: "#943CFF !important",
              height: "100%",
            },
          }}
        />
      </div>
    </div>
  );
};

const ScaleCalculator = ({
  value,
  isSelected,
  handleClick,
}: ScaleCalculatorProps) => {
  return (
    <div
      onClick={handleClick}
      sx={{
        width: "96px",
        height: "56px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #E6E6E6",
        boxSizing: "border-box",
        background: isSelected ? "#943CFF" : "#FBFBFB",
        cursor: "pointer",
        transition: "all 0.2s",
        ":hover": {
          boxShadow: "1px 1px 20px rgba(0, 0, 0, 0.05)",
        },
      }}>
      <p
        sx={{
          fontSize: "14px",
          letterSpacing: "-0.04em",
          color: isSelected ? "white" : "black",
          fontWeight: isSelected ? "600" : "400",
        }}>
        {value}%
      </p>
    </div>
  );
};

const Calculator = ({
  streamLength,
  monthlyStreams,
  viewCount,
  setStreamLength,
  setMonthlyStreams,
  setViewCount,
}: CalculatorProps) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  return (
    <div
      sx={{
        display: "flex",
        flexDirection: "column",
        pt: "32px",
        width: "480px",
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
        setValue={setStreamLength}
        min={0}
        max={57599}
        value={streamLength}>
        <input
          value={streamLength}
          sx={{
            height: "48px",
            width: "276px",
            borderRadius: "6px",
            border: "1px solid #E6E6E6",
            fontSize: "20px",
            letterSpacing: "-0.02em",
            px: "16px",
            "::placeholder": {
              color: "#7D7D7D",
            },
          }}
        />
      </CalculatorItem>
      <CalculatorItem
        title="Monthly live streams"
        setValue={setMonthlyStreams}
        min={0}
        max={100000}
        value={monthlyStreams}>
        <input
          value={monthlyStreams
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          placeholder="0"
          sx={{
            height: "48px",
            width: "276px",
            borderRadius: "6px",
            border: "1px solid #E6E6E6",
            fontSize: "20px",
            letterSpacing: "-0.02em",
            px: "16px",
            "::placeholder": {
              color: "#7D7D7D",
            },
          }}
        />
      </CalculatorItem>
      <CalculatorItem
        title="Monthly live stream view count"
        setValue={setViewCount}
        min={0}
        max={10000000}
        value={viewCount}>
        <input
          value={viewCount}
          placeholder="0"
          type="number"
          sx={{
            height: "48px",
            width: "276px",
            borderRadius: "6px",
            border: "1px solid #E6E6E6",
            fontSize: "20px",
            letterSpacing: "-0.02em",
            px: "16px",
            "::placeholder": {
              color: "#7D7D7D",
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
        <div sx={{ display: "flex", gap: "16px" }}>
          {scaleCalculatorValues.map((each, idx) => (
            <ScaleCalculator
              key={idx}
              value={each}
              isSelected={selectedValue === each}
              handleClick={() => {
                if (selectedValue === each) {
                  setSelectedValue(null);
                } else {
                  setSelectedValue(each);
                  setViewCount((10000000 * each) / 100);
                  setMonthlyStreams((100000 * each) / 100);
                  setStreamLength((57599 * each) / 100);
                }
              }}
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
}: PreviewItemProps) => {
  return (
    <div
      sx={{
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        minHeight: "136px",
        pt: "48px",
        pb: "32px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
      <div
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          maxWidth: "244px",
        }}>
        <h1
          sx={{
            fontSize: "20px",
            lineHeight: "24px",
            letterSpacing: "-0.04em",
            mb: "8px",
            fontWeight: "600",
          }}>
          {title}
        </h1>
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
          alignItems: 'flex-end'
        }}>
        <h1
          sx={{
            fontSize: "32px",
            lineHeight: "40px",
            letterSpacing: "-0.04em",
            fontWeight: "600",
          }}>
          {value}
        </h1>
        <p
          sx={{
            fontSize: "16px",
            lineHeight: "24px",
            letterSpacing: "-0.04em",
          }}>
          {valueClarification}
        </p>
      </div>
    </div>
  );
};

const Preview = ({ transcoding, streaming }: PreviewProps) => {
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
        width: "584px",
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
      <PreviewItem title="Transcoding" value="$0" />
      <PreviewItem title="Streaming via CDN" value="$0" />
      <PreviewItem
        title="Recording Storage"
        description="We will start charging for storage by the end of 2021"
        value="Coming soon"
      />
      <PreviewItem
        title="Total cost"
        description="Transcoding + Streaming via CDN"
        value={`$${transcoding + streaming}`}
        valueClarification={`$${transcoding} + $${streaming}`}
      />
      <button
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
          background: "#CCCCCC",
          borderRadius: "6px",
          mt: "10px",
        }}>
        Get Started
      </button>
    </div>
  );
};

export { Preview, Calculator };
