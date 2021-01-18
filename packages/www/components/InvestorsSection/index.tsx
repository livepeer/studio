import { Box, Grid, Container } from "@theme-ui/components";
import imageUrlBuilder from "@sanity/image-url";
import client from "../../lib/client";
import { Text } from "@theme-ui/components";

const investorIds = [
  "northzone",
  "compound",
  "dgc",
  "collaborative-fund",
  "notation",
];

const InvestorsSection = () => {
  return (
    <Box
      sx={{
        position: "relative",
        py: [64, 64, 128],
        bg: "text",
      }}>
      <Container>
        <Text
          sx={{
            fontSize: [2, 3],
            textAlign: "center",
            color: "lightGray",
            mb: 4,
          }}>
          Backed by these amazing organizations and trusted by the best
        </Text>
      </Container>
      <Container>
        <Grid
          sx={{ justifyContent: "center", alignItems: "center" }}
          gap={[5]}
          columns={[1, 3, 5]}>
          {investorIds.map((id) => (
            <img
              key={id}
              src={`/img/investors/${id}.svg`}
              alt={`${id} logo`}
              className="lazyload"
              sx={{ justifySelf: "center" }}
            />
          ))}
          {/* {investors.map((investor, i) => (
            <img
              key={i}
              width={investor.asset.metadata.dimensions.width}
              height={investor.asset.metadata.dimensions.height}
              alt={investor.alt}
              sx={{ justifySelf: "center", filter: "invert(1)" }}
              className="lazyload"
              data-src={builder.image(investor).url()}
            />
          ))} */}
        </Grid>
      </Container>
    </Box>
  );
};

export default InvestorsSection;
