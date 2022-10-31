import { Box as LiveBox } from "@livepeer/design-system";
import { Text, Container, Box } from "@theme-ui/components";

import React from "react";

export default function CenterTitle({ title, richText }) {
  return (
    <Box sx={{ paddingY: "64px" }}>
      <Container css={{ maxWidth: "800px", textAlign: "center" }}>
        <LiveBox
          css={{
            fontSize: 58,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-4px",
            mb: 32,
            "@bp1": {
              fontSize: 58,
            },
            "@bp2": {
              fontSize: 58,
            },
            "@bp3": {
              fontSize: 58,
            },
          }}>
          {title}
        </LiveBox>
        <Text sx={{ maxWidth: "640px", marginX: "auto" }}>{richText}</Text>
      </Container>
    </Box>
  );
}
