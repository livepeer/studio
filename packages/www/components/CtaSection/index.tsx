import { Styled } from "theme-ui";
import { Box, Container, Link as A } from "@theme-ui/components";
import Button from "../Button";
import { Link as ScrollLink } from "react-scroll";
import ArrowRight from "../../public/img/arrow-right.svg";

export default ({ heading, cta }) => (
  <Box
    sx={{
      textAlign: "center",
      position: "relative",
      py: 100,
      bg: "secondary"
    }}
  >
    <Container>
      {heading && (
        <Styled.h3 as="h2" sx={{ mb: 4, fontWeight: 600 }}>
          {heading}
        </Styled.h3>
      )}
      {renderSwitch(cta)}
    </Container>
  </Box>
);

function renderSwitch(cta) {
  switch (true) {
    case !!cta.internalLink?.slug?.current:
      return <Button variant="outline">{cta.title}</Button>;
    case !!cta.externalLink:
      return (
        <A
          variant="buttons.outline"
          sx={{ display: "inline-flex", alignItems: "center" }}
          target="__blank"
          href={cta.externalLink}
        >
          {cta.title}
          <ArrowRight sx={{ ml: 2 }} />
        </A>
      );
    default:
      return (
        <ScrollLink offset={-40} to={cta.anchorLink} spy smooth>
          <Button variant="outline">{cta.title}</Button>
        </ScrollLink>
      );
  }
}
