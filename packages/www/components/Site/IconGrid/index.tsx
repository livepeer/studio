import { urlFor } from "../../../lib/client";
import { Link as A, Box as LiveBox } from "@livepeer/design-system";
import { PortableText } from "@portabletext/react";
import { Text, Container, Box } from "@theme-ui/components";
import Image from "next/image";

export default function IconGrid({ title, richText, icons, portableTextRaw }) {
  console.log("portable Text on icon grid: ", portableTextRaw);
  return (
    <Box sx={{ paddingY: "64px" }}>
      <Container css={{ maxWidth: "1200px", textAlign: "center" }}>
        {title && (
          <Box sx={{ marginBottom: "32px" }}>
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
          </Box>
        )}
        <Box
          sx={{
            display: ["block", "flex"],
            justifyContent: ["unset", "space-between"],
            width: "100%",
            borderTop: "1px solid #666774",
            borderBottom: "1px solid #666774",
            paddingY: "64px",
            paddingX: "32px",
          }}>
          {icons.map((icon) => {
            return (
              <Box sx={{ display: "inline-block", padding: "32px" }}>
                <Image
                  alt="Livepeer"
                  src={urlFor(icon).url()}
                  width={100}
                  height={100}
                  placeholder="blur"
                  blurDataURL={urlFor(icon).width(24).height(24).blur(10).url()}
                />
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
