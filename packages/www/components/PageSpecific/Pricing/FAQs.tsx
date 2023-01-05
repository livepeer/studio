import React from "react";
import { Container, Box } from "@theme-ui/components";
import { Text, Box as LiveBox } from "@livepeer/design-system";

export const FAQ = () => {
  return (
    <Container
      sx={{
        paddingX: "15px",
      }}>
      <Box
        sx={{
          padding: "15px",
          textAlign: "center",
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
        <LiveBox
          css={{
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 0.8,
            letterSpacing: "-2px",
            mb: "8px",
            "@bp3": {
              fontSize: 48,
            },
          }}>
          {/* {title} */}
          Frequently Asked Questions
        </LiveBox>
      </Box>
    </Container>
  );
};
