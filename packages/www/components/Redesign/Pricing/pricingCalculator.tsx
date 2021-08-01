import { useState } from "react";
import { Calculator, Preview } from "./pricingCalculatorComponents";
import { Box, Grid, Heading, Text } from "@livepeer.com/design-system";

const PricingCalculator = () => {
  const [streamLength, setStreamLength] = useState<number>(600);
  const [monthlyStreams, setMonthlyStreams] = useState<number>(100);
  const [viewCount, setViewCount] = useState<number>(500);
  const [percentageWatched, setPercentageWatched] = useState<number>(75);

  const transcoding = (streamLength / 60) * monthlyStreams * 0.005;

  const streaming =
    ((60 * (streamLength / 60) * monthlyStreams * 2000) / 8 / 1024 / 1024) *
    viewCount *
    (percentageWatched / 100) *
    0.01;

  return (
    <Box css={{ display: "flex", flexDirection: "column", py: "$5" }}>
      <Heading
        size="3"
        as="h2"
        css={{
          mb: "$4",
          textAlign: "center",
        }}>
        Estimate your monthly costs
      </Heading>
      <Text
        variant="gray"
        size="5"
        css={{
          mb: "$9",
          alignSelf: "center",
          textAlign: "center",
        }}>
        Add details about your content and audience
      </Text>
      <Grid
        gap={8}
        css={{
          display: "grid",
          gridTemplateColumns: "repeat(1,1fr)",
          maxWidth: "100%",
          "@bp3": {
            gridTemplateColumns: "repeat(2,1fr)",
          },
        }}>
        <Calculator
          streamLength={streamLength}
          monthlyStreams={monthlyStreams}
          viewCount={viewCount}
          setViewCount={setViewCount}
          setMonthlyStreams={setMonthlyStreams}
          setStreamLength={setStreamLength}
          percentageWatched={percentageWatched}
          setPercentageWatched={setPercentageWatched}
        />
        <Preview transcoding={transcoding} streaming={streaming} />
      </Grid>
    </Box>
  );
};

export default PricingCalculator;
