import { Box, Grid, Container } from "@theme-ui/components";
import imageUrlBuilder from "@sanity/image-url";
import client from "../../lib/client";
import { Text } from "@theme-ui/components";

const InvestorsSection = ({ heading, investors }) => {
  const builder = imageUrlBuilder(client as any);
  return (
    <Box
      sx={{
        position: "relative",
        py: [64, 64, 128],
        bg: "text"
      }}
    >
      <Container>
        {heading && (
          <Text
            sx={{
              fontSize: [2, 3],
              textAlign: "center",
              color: "lightGray",
              mb: 4
            }}
          >
            {heading}
          </Text>
        )}
      </Container>
      <Container>
        <Grid
          sx={{ justifyContent: "center", alignItems: "center" }}
          gap={[5]}
          columns={[1, 3, 5]}
        >
          {investors.map((investor, i) => (
            <img
              key={i}
              width={investor.asset.metadata.dimensions.width}
              height={investor.asset.metadata.dimensions.height}
              alt={investor.alt}
              sx={{ justifySelf: "center", filter: "invert(1)" }}
              className="lazyload"
              data-src={builder.image(investor).url()}
            />
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default InvestorsSection;
