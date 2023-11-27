import React from "react";
import Banner from "components/Banner";
import { Stream } from "@livepeer.studio/api";
import { Box } from "@livepeer/design-system";

export type StreamHealthWarningAlertProps = {
  isBrowserBroadcastLive: boolean;
  stream: Stream & { isHealthy?: boolean; issues?: string[] };
};

const StreamHealthWarningAlert = ({
  stream,
  isBrowserBroadcastLive,
}: StreamHealthWarningAlertProps) => {
  return (
    <Box
      css={{
        mb: "$4",
      }}>
      {!stream.isHealthy && !isBrowserBroadcastLive && (
        <>
          {stream?.issues?.slice(0, 1)?.map((issue) => (
            <Banner
              title="Ingest warning"
              description={issue}
              titleCss={{
                color: "$yellow11",
                fontWeight: 600,
                fontSize: "14px",
              }}
              descriptionCss={{
                color: "$yellow11",
                fontSize: "12px",
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
