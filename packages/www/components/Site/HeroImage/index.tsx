import { PortableText } from "@portabletext/react";
import { Container, Box } from "@theme-ui/components";
import { Text, Box as LiveBox } from "@livepeer/design-system";
import Image from "next/image";
import { urlFor } from "../../../lib/client";

export default function HeroImage({ title, portableTextRaw, defaultImage }) {
  return (
    <Container
      sx={{
        paddingX: "15px",
      }}>
      <Box
        sx={{
          padding: "15px",
          background: "#ECEDEE",
          borderTopRightRadius: "12px",
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
        <Box
          sx={{
            height: ["400px", "400px", "600px", "600px", "800px"],
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
          }}>
          <Box
            sx={{
              position: "absolute",
              maxWidth: "800px",
              left: ["16px", "32px"],
              bottom: ["32px"],
              color: "#ECEDEE",
              zIndex: 1,
            }}>
            <LiveBox
              css={{
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 0.8,
                letterSpacing: "-2px",
                mb: "8px",
                "@bp1": {
                  fontSize: 60,
                },
                "@bp2": {
                  fontSize: 80,
                },
                "@bp3": {
                  fontSize: 100,
                },
              }}>
              {title}
            </LiveBox>
            {portableTextRaw && <PortableText value={portableTextRaw} />}
          </Box>
          <Image
            alt="Livepeer"
            src={urlFor(defaultImage).url()}
            placeholder="blur"
            blurDataURL={urlFor(defaultImage)
              .width(24)
              .height(24)
              .blur(10)
              .url()}
            layout="fill"
            objectFit="cover"
          />
        </Box>
      </Box>
    </Container>
  );
}