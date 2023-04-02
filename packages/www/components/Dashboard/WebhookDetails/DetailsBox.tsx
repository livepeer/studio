import { Text, Box, Badge, styled } from "@livepeer/design-system";
import { format } from "date-fns";
import { STATUS_CODES } from "http";
import ClipButton from "../Clipping/ClipButton";

const Cell = styled(Text, {
  py: "$2",
  fontSize: "$3",
});

const DetailsBox = ({ data }) => (
  <Box
    css={{
      display: "grid",
      gridTemplateColumns: "12em auto",
      width: "100%",
      fontSize: "$2",
      position: "relative",
      p: "$3",
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      backgroundColor: "$panel",
    }}>
    <Cell variant="neutral">Webhook ID</Cell>
    <Cell>
      <ClipButton text={data.id} value={data.id} />
    </Cell>
    <Cell variant="neutral">URL</Cell>
    <Cell>{data.url}</Cell>
    <Cell variant="neutral">Name</Cell>
    <Cell>{data.name}</Cell>
    <Cell variant="neutral">Secret</Cell>
    <Cell>{data.sharedSecret}</Cell>
    <Cell variant="neutral">Created</Cell>
    <Cell>{format(data.createdAt, "MMMM dd, yyyy h:mm a")}</Cell>
    <Cell variant="neutral">Event types</Cell>
    <Cell css={{ display: "flex", fw: "wrap" }}>
      {data.events.map((event, index) => (
        <Badge
          key={`badge-event${index}`}
          variant="primary"
          size="2"
          css={{ fontWeight: 600, mr: "$1", mb: "$1" }}>
          {event}
        </Badge>
      ))}
    </Cell>
    <Cell variant="neutral">Last trigger</Cell>
    <Cell>
      {data.status
        ? format(data.status?.lastTriggeredAt, "MMMM dd, yyyy h:mm:ss a")
        : "Never"}
    </Cell>
    <Cell variant="neutral">Last failure</Cell>
    <Cell>
      {!data.status
        ? "Never"
        : data.status.lastFailure
        ? format(data.status.lastFailure.timestamp, "MMMM dd, yyyy h:mm:ss a")
        : "Never"}
    </Cell>
    {data.status ? (
      data.status.lastFailure?.statusCode ? (
        <>
          <Cell variant="neutral">Error Status Code</Cell>
          <Cell>
            {`${data.status.lastFailure.statusCode}
            ${STATUS_CODES[data.status.lastFailure.statusCode]}`}
          </Cell>
        </>
      ) : data.status.lastFailure ? (
        <>
          <Cell variant="neutral">Error message</Cell>
          <Cell
            css={{
              fontFamily: "monospace",
            }}>
            {data.status.lastFailure.error ?? "unknown"}
          </Cell>
        </>
      ) : (
        ""
      )
    ) : (
      ""
    )}
    {data.status?.lastFailure?.response ? (
      <>
        <Cell variant="neutral">Error response</Cell>
        <Cell
          css={{
            fontFamily: "monospace",
          }}>
          {data.status.lastFailure.response}
        </Cell>
      </>
    ) : (
      ""
    )}
  </Box>
);

export default DetailsBox;
