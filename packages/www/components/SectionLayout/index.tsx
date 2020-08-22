import {
  Heading,
  Text,
  Flex,
  Link as A,
  Container
} from "@theme-ui/components";

type Props = {
  heading: {
    tag: string;
    title: string;
    cta: {
      label: React.ReactNode;
      onClick?: () => void;
      href?: string;
      asPath?: string;
    };
  };
  children: React.ReactNode;
};

const SectionLayout = ({ children, heading }: Props) => (
  <Container variant="content">
    <Flex>
      <div>
        <Text>{heading.tag}</Text>
        <Heading>{heading.title}</Heading>
      </div>
      {heading.cta && (
        // TODO check if it's link or button
        <A onClick={heading.cta.onClick}>{heading.cta.label}</A>
      )}
    </Flex>
    <div>{children}</div>
  </Container>
);

export default SectionLayout;
