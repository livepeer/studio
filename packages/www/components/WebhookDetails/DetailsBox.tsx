import { Text, Box, Badge, styled, Flex } from "@livepeer/design-system";
import { format } from "date-fns";
import { STATUS_CODES } from "http";
import ClipButton from "../Clipping/ClipButton";
import moment from "moment";
import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useState } from "react";

const Cell = styled(Text, {
  py: "$2",
  fontSize: "$3",
});

const demoRecords = [
  {
    name: "recording.record",
    id: "recording.record",
    timestamp: "2021-09-15T18:00:00.000Z",
    status: "success",
    response: 200,
  },
];

const DetailsBox = ({ data }) => {
  const [records, setRecords] = useState(demoRecords);
  const [selected, setSelected] = useState(0);
  return (
    <Box
      css={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        width: "100%",
        fontSize: "$2",
        mt: "$7",
        position: "relative",
        p: "$3",
        pb: "$0",
        borderTop: "1px solid $colors$neutral6",
      }}>
      <Box
        css={{
          borderRight: "1px solid $colors$neutral6",
        }}>
        <Text
          css={{
            fontWeight: 600,
          }}
          size={"2"}
          variant={"gray"}>
          TODAY:
        </Text>
        {demoRecords.map((record, index) => (
          <Box
            onClick={() => setSelected(index)}
            key={record.id}
            css={{
              display: "flex",
              justifyContent: "space-between",
              py: "$2",
              borderBottom: "1px solid $colors$neutral6",
              "&:hover": {
                background: "$neutral2",
              },
            }}>
            <Cell
              css={{
                fontFamily: "$mono",
              }}>
              <Badge
                css={{
                  mr: "$2",
                  width: 30,
                  height: 30,
                }}
                variant={record.status === "success" ? "green" : "red"}>
                {record.status === "success" ? <CheckIcon /> : <Cross1Icon />}
              </Badge>
              {record.name}
            </Cell>
            <Cell
              css={{
                mr: "$3",
              }}>
              {moment(record.timestamp).format("h:mm:ss a")}
            </Cell>
          </Box>
        ))}
      </Box>
      <Box
        css={{
          p: "$6",
        }}>
        <Text
          size="5"
          css={{
            fontWeight: 500,
          }}>
          {demoRecords[selected].name}
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
            <Text variant="neutral">200 OK</Text>
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
              width: "40%",
              mt: "$3",
              ml: "$3",
            }}>
            <Text variant="neutral">Code here...</Text>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default DetailsBox;
