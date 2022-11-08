import { Box as LiveBox } from "@livepeer/design-system";
import { PortableText } from "@portabletext/react";
import { Text, Container, Box } from "@theme-ui/components";

import React from "react";

export default function CenterTitle({ title, richText, portableTextRaw }) {
  return (
    <Box sx={{ paddingY: "64px", px: "16px" }}>
      <Container css={{ maxWidth: "800px", textAlign: "center" }}>
        <LiveBox
          css={{
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1,
            mb: 32,
            letterSpacing: "0px",
            "@bp1": {
              fontSize: 40,
              letterSpacing: "-1px",
            },
            "@bp2": {
              fontSize: 50,
              letterSpacing: "-2px",
            },
            "@bp3": {
              fontSize: 58,
              letterSpacing: "-4px",
            },
          }}>
          {title}
        </LiveBox>
        <Text sx={{ maxWidth: "640px", marginX: "auto" }}>{richText}</Text>
        {portableTextRaw && <PortableText value={portableTextRaw} />}
      </Container>
    </Box>
  );
}
