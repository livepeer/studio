import AppPlayer from "components/AppPlayer";
import { Badge, Box, Status } from "@livepeer/design-system";

const ActiveStream = ({ playbackUrl }: { playbackUrl: string }) => (
  <>
    <Badge
      size="2"
      variant="green"
      css={{
        position: "absolute",
        zIndex: 1,
        left: 10,
        top: 10,
        letterSpacing: 0,
      }}>
      <Box css={{ mr: 5 }}>
        <Status size="1" variant="green" />
      </Box>
      Active
    </Badge>
    <AppPlayer playbackUrl={playbackUrl} type="stream" />
  </>
);

export default ActiveStream;
