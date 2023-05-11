import { Box, Flex, Text, Promo } from "@livepeer/design-system";

const Banner = ({
  title,
  description,
  button,
  link,
  css,
  titleCss,
  descriptionCss,
}: {
  title: string;
  description: string;
  button?: any;
  link?: any;
  css?: any;
  titleCss?: any;
  descriptionCss?: any;
}) => {
  return (
    <Promo
      size="2"
      css={{
        borderRadius: "$2",
        display: "grid",
        gridTemplateColumns: "repeat(2, auto)",
        ...css,
      }}>
      <Flex>
        <Box>
          <Text
            size="2"
            css={{
              fontSize: "14px",
              mb: "$1",
              fontWeight: 500,
              ...titleCss,
            }}>
            {title}
          </Text>
          <Text
            variant="neutral"
            size="2"
            css={{ lineHeight: 1.4, ...descriptionCss }}>
            {description}
          </Text>
        </Box>
      </Flex>
      <Flex align="center" justify="end">
        {button}
        {link}
      </Flex>
    </Promo>
  );
};

export default Banner;
