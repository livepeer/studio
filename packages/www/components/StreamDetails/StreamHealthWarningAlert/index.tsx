import React from "react";
import Banner from "components/Banner";
import { Stream } from "livepeer";
import { Box } from "@livepeer/design-system";

export type StreamHealthWarningAlertProps = {
  stream: Stream & { isHealthy?: boolean; issues?: string[] };
};

const StreamHealthWarningAlert = ({
  stream,
}: StreamHealthWarningAlertProps) => {
  return (
    <Box
      css={{
        mb: "$7",
      }}>
      {!stream.isHealthy && (
        <>
          {stream?.issues?.map((issue) => (
            <Banner
              title="Ingest error"
              description={issue}
              titleCss={{
                color: "$yellow11",
                fontWeight: 600,
              }}
              descriptionCss={{
                color: "$yellow11",
              }}
              css={{
                background: "$yellow2",
                mb: "$3",
              }}
            />
          ))}
        </>
      )}
    </Box>
  );
};

export default StreamHealthWarningAlert;
