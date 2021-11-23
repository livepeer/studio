import { Box, Grid, Text, Container } from "@livepeer.com/design-system";

const Investors = ({ backgroundColor }) => {
  return (
    <Box
      css={{
        position: "relative",
        backgroundColor,
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
            <Box
              as="img"
              width="137"
              height="25"
              src={`/img/investors/northzone.svg`}
              alt={`northzone logo`}
              className="lazyload"
              css={{
                justifySelf: "center",
                mb: "$5",
                "@bp1": {
                  mb: 0,
                },
              }}
            />
            <Box
              as="img"
              width="136"
              height="27"
              src={`/img/investors/compound.svg`}
              alt={`compound logo`}
              className="lazyload"
              css={{
                justifySelf: "center",
                mb: "$5",
                "@bp1": {
                  mb: 0,
                },
              }}
            />
            <Box
              as="img"
              width="96"
              height="68"
              src={`/img/investors/dgc.svg`}
              alt={`dgc logo`}
              className="lazyload"
              css={{
                justifySelf: "center",
                mb: "$5",
                "@bp1": {
                  mb: 0,
                },
              }}
            />
            <Box
              as="img"
              width="157"
              height="21"
              src={`/img/investors/collaborative-fund.svg`}
              alt={`collaborative-fund logo`}
              className="lazyload"
              css={{
                justifySelf: "center",
                mb: "$5",
                "@bp1": {
                  mb: 0,
                },
              }}
            />
            <Box
              as="img"
              width="111"
              height="31"
              src={`/img/investors/notation.svg`}
              alt={`notation logo`}
              className="lazyload"
              css={{
                justifySelf: "center",
                mb: "$5",
                "@bp1": {
                  mb: 0,
                },
              }}
            />
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Investors;
