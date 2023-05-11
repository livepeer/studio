import { Button } from "@livepeer/design-system";
import React, { useState } from "react";
import Banner from "components/Banner";
import { Stream } from "livepeer";
import StreamHealthWarningDialog from "./StreamHealthWarningDialog";

export type StreamHealthWarningAlertProps = {
  stream: Stream & { isHealthy?: boolean; issues?: string[] };
};

const turcate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  } else {
    return text.slice(0, maxLength) + "...";
  }
};

const StreamHealthWarningAlert = ({
  stream,
}: StreamHealthWarningAlertProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [issue, setIssue] = useState<string>("");

  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {!stream.isHealthy && (
        <>
          {stream?.issues?.map((issue) => (
            <Banner
              title="Ingest error"
              description={turcate(issue, 100)}
              button={
                <Button
                  variant="primary"
                  onClick={() => {
                    setIssue(issue);
                    toggleDialog();
                  }}
                  as="a"
                  size="2"
                  css={{
                    cursor: "pointer",
                    background: "transparent",
                    border: 0,
                    color: "$yellow11",
                    "&:hover": {
                      background: "transparent",
                    },
                  }}>
                  More info
                </Button>
              }
              titleCss={{
                color: "$yellow11",
                fontWeight: 600,
              }}
              descriptionCss={{
                color: "$yellow11",
              }}
              css={{
                mb: "$7",
                background: "$yellow2",
              }}
            />
          ))}
        </>
      )}
      <StreamHealthWarningDialog
        isOpen={isOpen}
        onOpenChange={toggleDialog}
        issue={issue}
      />
    </>
  );
};

export default StreamHealthWarningAlert;
