import { Grid, Container } from "@theme-ui/components";
import TestimonialCard from "../TestimonialCard";
import GradientBackgroundBox from "../GradientBackgroundBox";

const TestimonialsSection = ({ testimonials }) => (
  <GradientBackgroundBox
    id="testimonials"
    gradient="colorful"
    gradientSx={{ minWidth: ["5000px", null, "unset"] }}
    slide
  >
    <Container sx={{ py: [5, 6] }}>
      <Grid
        sx={{ justifyContent: "center", alignItems: "center" }}
        gap={[3, 3, 3, 4]}
        columns={[1, null, testimonials.length]}
      >
        {testimonials.map((testimonial, i) => (
          <TestimonialCard
            key={i}
            quote={testimonial.quote}
            name={testimonial.name}
            role={testimonial.role}
            company={testimonial.company}
            image={testimonial.image}
            companyLogo={null} // TODO add this to Sanity
          />
        ))}
      </Grid>
    </Container>
  </GradientBackgroundBox>
);

export default TestimonialsSection;
