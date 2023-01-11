import React from "react";
import { Container, Box } from "@theme-ui/components";
import { Box as LiveBox } from "@livepeer/design-system";
import { PortableText } from "@portabletext/react";

const Faqs = ({ title, portableText }) => {
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
            mt: "64px",
            "@bp3": {
              fontSize: 48,
            },
          }}>
          {title}
        </LiveBox>
        <Box
          sx={{
            maxWidth: "800px",
            fontSize: ["1.rem", "1.rem", "1.5rem"],
            mt: "64px",
            mx: "auto",
            textAlign: "left",
          }}>
          {portableText && <PortableText value={portableText} />}
        </Box>
      </Box>
    </Container>
  );
};
export default Faqs;
