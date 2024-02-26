import {
  Text,
  Box,
  Badge,
  styled,
  Flex,
  Button,
} from "@livepeer/design-system";
import moment from "moment";
import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { WebhookLogs } from "hooks/use-api/types";
import JSONPretty from "react-json-pretty";
import { useApi } from "hooks";
import { useRouter } from "next/navigation";

const Cell = styled(Text, {
  py: "$2",
  fontFamily: "$mono",
  fontSize: "$3",
});

const LogsContainer = ({ data, logs, filter }) => {
  const { resendWebhook } = useApi();

  const [selected, setSelected] = useState<WebhookLogs>(logs[0]);
  const [isResending, setIsResending] = useState(false);

  const succeededLogs = logs?.filter((log) => log.success);

  const failedLogs = logs?.filter((log) => !log.success);

  const router = useRouter();

  const renderedLogs =
    filter === "all"
      ? logs
      : filter === "succeeded"
      ? succeededLogs
      : failedLogs;

  const customTheme = {
    key: "color:#606060;line-height:1.8;font-size:14px;",
    string: "color:#DABAAB;font-size:14px",
    value: "color:#788570;font-size:14px",
    boolean: "color:#788570;font-size:14px",
  };

  const onResend = async (log: WebhookLogs) => {
    setIsResending(true);
    const res = await resendWebhook({
      webhookId: data.id,
      logId: log.id,
    });

    if (res) {
      setIsResending(false);
    }
  };

  return (
    <Box
      css={{
        width: "100%",
        fontSize: "$2",
        position: "relative",
        pt: "$4",
        borderTop: "1px solid $colors$neutral6",
      }}>
      <Flex>
        <Box
          css={{
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
            LOGS:
          </Text>
          <Box
            css={{
              overflowY: "auto",
              borderRight: "1px solid $colors$neutral6",
              height: "calc(100vh - 450px)",
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
                  cursor: "pointer",
                  "&:hover": {
                    background: "$neutral2",
                  },
                }}>
                <Cell
                  css={{
                    color: "$neutral11",
                  }}>
                  <Badge
                    css={{
                      mr: "$2",
                      width: 30,
                      height: 30,
                    }}
                    variant={log.success ? "green" : "red"}>
                    {log.success ? <CheckIcon /> : <Cross1Icon />}
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
            pr: "$0",
            width: "50%",
            pt: "$3",
          }}>
          <Flex align={"center"} justify={"between"}>
            <Text
              size="6"
              css={{
                fontWeight: 500,
              }}>
              {selected?.event}
            </Text>
            <Button
              onClick={() => onResend(selected)}
              disabled={isResending}
              size={"3"}
              css={{
                backgroundColor: "transparent",
                border: "1px solid",
                px: "$3",
                fontWeight: 500,
                borderColor: "$neutral8",
                color: "$neutral112",
              }}>
              {isResending ? "Resending..." : "Resend"}
            </Button>
          </Flex>
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
              css={{
                mt: "$3",
              }}>
              <Text variant="neutral">HTTP Status Code</Text>
              <Text
                css={{
                  ml: "$4",
                }}
                variant="neutral">
                {selected?.response?.status} {selected?.response?.statusText}
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
                height: "calc(100vh - 650px)",
                // ml: "$3",
              }}>
              {selected?.request && (
                <JSONPretty
                  theme={customTheme}
                  data={JSON.stringify(
                    JSON.parse(selected?.request?.body)?.payload ||
                      JSON.parse(selected?.request?.body)?.stream ||
                      JSON.parse(selected?.request?.body)?.asset ||
                      JSON.parse(selected?.request?.body)?.task
                  )}
                />
              )}
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default LogsContainer;
