import {
  Box,
  Grid,
  Text,
  Container,
  darkTheme,
} from "@livepeer.com/design-system";
import Guides from "components/Redesign/Guides";

const investorIds = [
  "northzone",
  "compound",
  "dgc",
  "collaborative-fund",
  "notation",
];
const Investors = () => {
  const { colors }: any = darkTheme;

  return (
    <Box
      css={{
        position: "relative",
        backgroundColor: "$hiContrast",
      }}>
      <Container
        size="3"
        css={{
          width: "100%",
          py: 64,
          px: 0,
          "@bp2": {
            py: 128,
          },
        }}>
        <Box
          css={{
            px: "$6",
            "@bp3": {
              px: "$3",
            },
          }}>
          <Text
            size="6"
            css={{
              color: "$mauve9",
              textAlign: "center",
              mb: "$8",
            }}>
            Backed by these amazing organizations and trusted by the best
          </Text>

          <Grid
            css={{
              justifyContent: "center",
              alignItems: "center",
              gridTemplateColumns: "repeat(1,1fr)",
              "@bp1": {
                gridTemplateColumns: "repeat(3,1fr)",
              },
              "@bp2": {
                gridTemplateColumns: "repeat(5,1fr)",
              },
            }}
            gap="5">
            {investorIds.map((id) => (
              <Box
                as="img"
                key={id}
                src={`/img/investors/${id}.svg`}
                alt={`${id} logo`}
                className="lazyload"
                css={{ justifySelf: "center" }}
              />
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Investors;
