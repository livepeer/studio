import { Box, Grid, Container } from "@livepeer.com/design-system";
import Card, { CardProps } from "./Card";
import Guides from "@components/Marketing/Guides";
import CBSIcon from "../../../public/img/testimonials/cbs-interactive/logo.svg";
import HousePartyIcon from "../../../public/img/testimonials/houseparty/logo.svg";
import PlayDJIcon from "../../../public/img/testimonials/playdj-tv/logo.svg";

const testimonials: CardProps[] = [
  {
    quote:
      "Livepeer Video Services is an exciting video infrastructure solution that’s highly reliable and price disruptive.",
    id: "cbs-interactive",
    logo: <CBSIcon css={{ color: "$hiContrast" }} />,
    author: {
      name: "Flávio Ribeiro",
      role: "Director of Engineering",
      company: "CBS Interactive",
    },
  },
  {
    quote:
      "Livepeer Video Services is an incredible team building the future of video infrastructure services.",
    id: "houseparty",
    logo: <HousePartyIcon css={{ color: "$hiContrast" }} />,
    author: {
      name: "Ben Rubin",
      role: "CEO",
      company: "Houseparty (acquired by Epic Games)",
    },
  },
  {
    quote:
      "Partnering with Livepeer Video Services has allowed PlayDJ.tv to get ahead of our competitors through innovation and new technology.",
    id: "playdj-tv",
    logo: <PlayDJIcon css={{ color: "$hiContrast" }} />,
    author: {
      name: "Tom Burman",
      role: "Co-Founder",
      company: "PlayDJ.TV",
    },
  },
];

const Testimonials = () => (
  <Box css={{ position: "relative" }}>
    <Guides backgroundColor="$loContrast" />
    <Container
      size="3"
      css={{
        px: 0,
        width: "100%",
        py: 72,
        "@bp2": {
          py: 140,
        },
      }}>
      <Box
        css={{
          px: "$6",
          "@bp3": {
            px: "$3",
          },
        }}>
        <Grid
          css={{
            justifyContent: "center",
            alignItems: "center",
            gridTemplateColumns: "repeat(1,1fr)",
            "@bp2": {
              gridTemplateColumns: "repeat(3,1fr)",
            },
          }}
          gap="4">
          {testimonials.map((testimonial, i) => (
            <Card key={i} {...testimonial} />
          ))}
        </Grid>
      </Box>
    </Container>
  </Box>
);

export default Testimonials;
