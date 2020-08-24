import {
  Heading,
  Text,
  Flex,
  Link as A,
  Container
} from "@theme-ui/components";
import GradientBackgroundBox from "../GradientBackgroundBox";
import Button, { ButtonProps } from "../Button";

type Props = {
  heading: {
    tag: string;
    title: string;
    cta: ButtonProps;
  };
  children: React.ReactNode;
  withGradientBackground?: boolean;
};

const SectionLayout = ({
  children,
  heading,
  withGradientBackground
}: Props) => (
  <GradientBackgroundBox withoutGradient={!withGradientBackground}>
    <Container
      variant="content"
      sx={{ pt: withGradientBackground ? [6, 7] : undefined }}
    >
      <div>
        <Text
          sx={{
            textTransform: "uppercase",
            color: "primary",
            fontWeight: "bold",
            letterSpacing: "0.24em",
            mb: 3,
            fontSize: [1, 2]
          }}
        >
          {heading.tag}
        </Text>
        <Flex
          sx={{
            alignItems: ["flex-start", "center"],
            flexDirection: ["column", "row"]
          }}
        >
          <Heading sx={{ fontWeight: "bold" }} variant="heading.section">
            {heading.title}
          </Heading>
          {heading.cta && (
            <Button
              {...heading.cta}
              sx={{ minWidth: "fit-content", ml: [0, 3], mt: [4, 0] }}
            />
          )}
        </Flex>
      </div>
      <div sx={{ mt: 5 }}>{children}</div>
    </Container>
  </GradientBackgroundBox>
);

export default SectionLayout;
