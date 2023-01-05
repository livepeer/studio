import React from "react";
import { Container, Box } from "@theme-ui/components";
import { Text, Box as LiveBox } from "@livepeer/design-system";
import Image from "next/image";

export const IconCards = () => {
  return (
    <Container
      sx={{
        padding: "15px",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
      <Box
        sx={{
          padding: "15px",
          pt: "64px",
          textAlign: "center",
          marginLeft: "auto",
          marginRight: "auto",
          background: "#ECEDEE",
          borderRadius: "12px",
          color: "#000000",
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
          Why Livepeer Studio
        </LiveBox>
        <Box sx={{ fontSize: "28px", maxWidth: "600px", mx: "auto" }}>
          Livepeer Studio is an easy-to-use video toolkit for building apps with
          video.
        </Box>
        <Box
          sx={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "1fr",
            gap: "16px",
            marginTop: "64px",
            textAlign: "left",
          }}>
          <Box
            sx={{
              border: "1px solid #00000026",
              borderRadius: "12px",
              padding: "16px",
            }}>
            <Box>
              <Image
                src="http://picsum.photos/80"
                alt="image"
                width={80}
                height={80}
              />
              <p>
                Livepeer Studio is an easy-to-use video toolkit for building
                apps with video.
              </p>
            </Box>
          </Box>
          <Box
            sx={{
              border: "1px solid #00000026",
              borderRadius: "12px",
              padding: "16px",
            }}>
            <Box>
              <Image
                src="http://picsum.photos/80"
                alt="image"
                width={80}
                height={80}
              />
              <p>
                Livepeer Studio is an easy-to-use video toolkit for building
                apps with video.
              </p>
            </Box>
          </Box>
          <Box
            sx={{
              border: "1px solid #00000026",
              borderRadius: "12px",
              padding: "16px",
            }}>
            <Box>
              <Image
                src="http://picsum.photos/80"
                alt="image"
                width={80}
                height={80}
              />
              <p>
                Livepeer Studio is an easy-to-use video toolkit for building
                apps with video.
              </p>
            </Box>
          </Box>
          <Box
            sx={{
              border: "1px solid #00000026",
              borderRadius: "12px",
              padding: "16px",
            }}>
            <Box>
              <Image
                src="http://picsum.photos/80"
                alt="image"
                width={80}
                height={80}
              />
              <p>
                Livepeer Studio is an easy-to-use video toolkit for building
                apps with video.
              </p>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
