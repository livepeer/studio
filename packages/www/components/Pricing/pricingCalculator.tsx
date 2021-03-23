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
};

const CalculatorItem = ({ title, children, max, min }: CalculatorItemProps) => {
  const [value, setValue] = useState(0);

  function handleChange(e) {
    const value = e.target.value;
    setValue(value);
  }
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

const Calculator = () => {
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
      <CalculatorItem title="Average length of stream" min={0} max={57599}>
        <input
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
      <CalculatorItem title="Monthly live streams" min={0} max={100000}>
        <input
        placeholder='0'
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
        min={0}
        max={10000000}>
        <input
        placeholder='0'
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

const PricingCalculator = () => {
  const [transcoding, setTranscoding] = useState<number>(0);
  const [streaming, setStreaming] = useState<number>(0);
  return (
    <div sx={{ display: "flex", flexDirection: "column", mt: "144px" }}>
      <h1
        sx={{
          fontSize: [5, 5, 6],
          mb: "16px",
          textAlign: "center",
          letterSpacing: "-0.04em",
        }}>
        Estimate your monthly costs
      </h1>
      <p
        sx={{
          mb: "64px",
          fontSize: ["20px", "24px"],
          lineHeight: "29px",
          letterSpacing: "-0.02em",
          alignSelf: "center",
          textAlign: "center",
        }}>
        Add details about your content and audience
      </p>
      <div
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: "135px",
        }}>
        <Calculator />
        <Preview transcoding={transcoding} streaming={streaming} />
      </div>
    </div>
  );
};

export default PricingCalculator;
