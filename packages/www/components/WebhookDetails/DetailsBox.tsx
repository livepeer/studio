import { Text, Box, Badge, styled, Flex } from "@livepeer/design-system";
import moment from "moment";
import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { WebhookLogs } from "hooks/use-api/types";
import JSONPretty from "react-json-pretty";

const Cell = styled(Text, {
  py: "$2",
  fontSize: "$3",
});

const DetailsBox = ({ data, logs, filter }) => {
  const [selected, setSelected] = useState<WebhookLogs>(logs[0]);

  const succeededLogs = logs?.filter((log) => log.response.status === 200);
  const failedLogs = logs?.filter((log) => log.response.status !== 200);

  const renderedLogs =
    filter === "all"
      ? logs
      : filter === "succeeded"
      ? succeededLogs
      : failedLogs;

  return (
    <Box
      css={{
        width: "100%",
        fontSize: "$2",
        mt: "$5",
        position: "relative",
        p: "$3",
        pl: "$0",
        pb: "$0",
        borderTop: "1px solid $colors$neutral6",
      }}>
      <Flex>
        <Box
          css={{
            borderRight: "1px solid $colors$neutral6",
            width: "50%",
          }}>
          <Text
            css={{
              fontWeight: 600,
              ml: "$3",
              mb: "$1",
            }}
            size={"2"}
            variant={"gray"}>
            TODAY:
          </Text>
          <Box
            css={{
              overflowY: "auto",
              maxHeight: "calc(100vh - 300px)",
            }}>
            {renderedLogs.map((log: WebhookLogs, index) => (
              <Box
                onClick={() => setSelected(log)}
                key={log.id}
                css={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: "$1",
                  pl: "$3",
                  borderBottom: "1px solid $colors$neutral6",
                  "&:hover": {
                    background: "$neutral2",
                  },
                }}>
                <Cell
                  css={{
                    fontFamily: "$mono",
                    color: "$neutral11",
                  }}>
                  <Badge
                    css={{
                      mr: "$2",
                      width: 30,
                      height: 30,
                    }}
                    variant={log.response.status === 200 ? "green" : "red"}>
                    {log.response.status === 200 ? (
                      <CheckIcon />
                    ) : (
                      <Cross1Icon />
                    )}
                  </Badge>
                  {log.event}
                </Cell>
                <Cell
                  css={{
                    mr: "$3",
                    color: "$neutral11",
                  }}>
                  {moment(log.createdAt).format("h:mm:ss a")}
                </Cell>
              </Box>
            ))}
          </Box>
        </Box>
        <Box
          css={{
            p: "$6",
            width: "50%",
            pt: "$3",
          }}>
          <Text
            size="6"
            css={{
              fontWeight: 500,
            }}>
            {selected.event}
          </Text>
          <Box>
            <Text
              size="4"
              css={{
                mt: "$6",
                fontWeight: 500,
              }}>
              Response
            </Text>
            <Flex
              direction={"row"}
              justify={"between"}
              css={{
                width: "40%",
                mt: "$3",
                ml: "$3",
              }}>
              <Text variant="neutral">HTTP Status Code</Text>
              <Text variant="neutral">
                {selected.response.status} {selected.response.statusText}
              </Text>
            </Flex>
          </Box>
          <Box
            css={{
              borderTop: "1px solid $colors$neutral6",
              mt: "$4",
            }}>
            <Text
              size="4"
              css={{
                mt: "$4",
                fontWeight: 500,
              }}>
              Request
            </Text>
            <Flex
              direction={"row"}
              justify={"between"}
              css={{
                mt: "$3",
                overflowY: "auto",
                maxHeight: "calc(100vh - 45em)",
                ml: "$3",
              }}>
              <JSONPretty
                id="json-pretty"
                theme={{
                  key: "color:#606060;line-height:1.8;font-size:14px;",
                  string: "color:#DABAAB;font-size:14px",
                  value: "color:#788570;font-size:14px",
                  boolean: "color:#788570;font-size:14px",
                }}
                data={selected.request.body}
              />
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default DetailsBox;
