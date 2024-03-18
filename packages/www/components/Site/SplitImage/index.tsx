import { urlFor } from "../../../lib/client";
import { Box } from "@livepeer/design-system";
import { PortableText } from "@portabletext/react";
import Image from "next/image";

export default function SplitImage({
  inverted,
  title,
  defaultImage,
  portableText,
}) {
  return (
    <Box
      css={{
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: "1fr",
        mx: "auto",
        gap: 80,
        mb: "$8",
        "@bp2": {
          gap: 140,
          gridTemplateColumns: "1fr 1fr",
        },
      }}>
      <img
        src={urlFor(defaultImage).url()}
        alt={title}
        style={{ objectFit: "contain", width: "100%", height: "100%" }}
      />
      <Box
        css={{
          borderRadius: "12px",
          gridColumn: "unset",
          gridRow: 1,
          "@bp2": {
            order: inverted ? 1 : 1,
          },
        }}>
        {portableText && <PortableText value={portableText} />}
      </Box>
    </Box>
  );
}
