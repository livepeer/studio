import { Box, Flex, Text, Promo } from "@livepeer.com/design-system";

const Banner = ({
  title,
  description,
  button,
  link,
  css,
}: {
  title: string;
  description: string;
  button?: any;
  link?: any;
  css?: any;
}) => {
  return (
    <Promo size="2" css={{ ...css }}>
      <Flex>
        <Box>
          <Text size="2" css={{ fontSize: "14px", mb: "$1", fontWeight: 500 }}>
            {title}
          </Text>
          <Text variant="gray" size="2" css={{ lineHeight: 1.4 }}>
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
