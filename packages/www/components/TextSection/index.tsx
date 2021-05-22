/** @jsx jsx */
import { jsx } from "theme-ui";
import SimpleBlockContent from "../SimpleBlockContent";
import { Container, Box } from "@theme-ui/components";

export default ({ text }) => (
  <Box sx={{ pb: 100 }}>
    <Container>
      <Box sx={{ p: { mb: 4 } }}>
        <SimpleBlockContent blocks={text} />
      </Box>
    </Container>
  </Box>
);
