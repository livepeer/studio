import { Link as A, Box as LiveBox } from "@livepeer/design-system";
import { Text, Container, Box } from "@theme-ui/components";
import Image from "next/image";

export default function IconGrid({ title, richText }) {
  return (
    <Box sx={{ paddingY: "64px" }}>
      <Container css={{ maxWidth: "1200px", textAlign: "center" }}>
        {title && (
          <Box sx={{ marginBottom: "32px" }}>
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
          </Box>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            borderTop: "1px solid #666774",
            borderBottom: "1px solid #666774",
            paddingY: "64px",
          }}>
          <Box>
            <Image
              src="/img/share-icon.png"
              alt="REPLACE ME"
              width={100}
              height={100}
            />
          </Box>
          <Box>
            <Image
              src="/img/share-icon.png"
              alt="REPLACE ME"
              width={100}
              height={100}
            />
          </Box>
          <Box>
            <Image
              src="/img/share-icon.png"
              alt="REPLACE ME"
              width={100}
              height={100}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
