/** @jsx jsx */
import { jsx } from "theme-ui";
import { Grid, Container } from "@theme-ui/components";
import TestimonialCard, { TestimonialCardProps } from "../TestimonialCard";
import GradientBackgroundBox from "../GradientBackgroundBox";

const testimonials: TestimonialCardProps[] = [
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

const TestimonialsSection = () => (
  <GradientBackgroundBox
    id="testimonials"
    gradient="colorful"
    gradientSx={{ minWidth: ["5000px", null, null, "unset"] }}
    slide>
    <Container sx={{ py: [5, 6] }}>
      <Grid
        sx={{ justifyContent: "center", alignItems: "center" }}
        gap={[3, 3, 3, 4]}
        columns={[1, null, null, testimonials.length]}>
        {testimonials.map((testimonial, i) => (
          <TestimonialCard key={i} {...testimonial} />
        ))}
      </Grid>
    </Container>
  </GradientBackgroundBox>
);

export default TestimonialsSection;
