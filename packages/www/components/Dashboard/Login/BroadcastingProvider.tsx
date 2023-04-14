import { Box, Text, TextField } from "@livepeer/design-system";

const BroadcastingProvider = () => {
  return (
    <>
      <Text
        variant="neutral"
        size={1}
        css={{
          mb: "$1",
          fontSize: "11px",
          textTransform: "uppercase",
          fontWeight: 600,
        }}>
        Broadcasting provider
      </Text>
      <Box css={{ position: "relative" }}>
        <TextField
          readOnly
          size="3"
          id="broadcastingProvider"
          css={{
            width: "100%",
            bc: "$neutral2",
            color: "$neutral11",
            fontSize: "$2",
          }}
          name="broadcastingProvider"
          type="text"
          value="Livepeer Inc (livepeer.eth)"
          required
        />
      </Box>
      <Text
        variant="neutral"
        css={{
          fontSize: "11px",
          mt: "$1",
          mb: "$5",
        }}>
        This is the operator that provides hosted access to the Livepeer
        network. In a future release you may switch providers at any time.
      </Text>
    </>
  );
};

export default BroadcastingProvider;
