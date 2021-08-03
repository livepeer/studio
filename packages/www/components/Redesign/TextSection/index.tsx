import SimpleBlockContent from "../SimpleBlockContent";
import { Container, Box } from "@livepeer.com/design-system";
import Guides from "components/Redesign/Guides";

const TextSection = ({ text }) => (
  <Box>
    <Guides backgroundColor="$loContrast" />
    <Box css={{ position: "relative" }}>
      <Container
        size="3"
        css={{
          pb: 80,
          px: "$4",
          mx: "$4",
          "@bp3": {
            px: "$4",
            mx: "auto",
          },
        }}>
        <Box css={{ maxWidth: 768, mx: "auto" }}>
          <Box css={{ p: { mb: "$4" } }}>
            <SimpleBlockContent blocks={text} />
          </Box>
        </Box>
      </Container>
    </Box>
  </Box>
);

export default TextSection;
