import { Box, Grid, Container } from "@livepeer.com/design-system";
import Card, { CardProps } from "./Card";
import Guides from "components/Redesign/Guides";

const testimonials: CardProps[] = [
  {
    quote:
      "Livepeer.com is an exciting video infrastructure solution that’s highly reliable and price disruptive.",
    id: "cbs-interactive",
    author: {
      name: "Flávio Ribeiro",
      role: "Director of Engineering",
      company: "CBS Interactive",
    },
  },
  {
    quote:
      "Livepeer.com is an incredible team building the future of video infrastructure services.",
    id: "houseparty",
    author: {
      name: "Ben Rubin",
      role: "CEO",
      company: "Houseparty (Acquired by Epic Games)",
    },
  },
  {
    quote:
      "Partnering with Livepeer.com has allowed PlayDJ.tv to get ahead of our competitors through innovation and new technology.",
    id: "playdj-tv",
    author: {
      name: "Tom Burman",
      role: "Co-founder",
      company: "PlayDJ.TV",
    },
  },
];

const Testimonials = () => (
  <Box css={{ position: "relative" }}>
    <Guides backgroundColor="$panel" />
    <Container size="3" css={{ px: 0, width: "100%", py: 140 }}>
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
