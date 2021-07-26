import { Box, Flex, Text } from "@livepeer.com/design-system";

export type CardProps = {
  id: string;
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
  };
};

const Card = ({ id, quote, author }: CardProps) => (
  <Box
    css={{
      position: "relative",
      backgroundColor: "white",
      py: 32,
      px: 24,
      borderRadius: 24,
      minHeight: 360,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      transition: "box-shadow .3s",
      boxShadow:
        "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
      "@bp2": {
        minHeight: 380,
      },
    }}>
    <img
      alt={`${id} logo`}
      className="lazyload"
      src={`/img/testimonials/${id}/logo.svg`}
    />
    <Box css={{ fontWeight: 400, my: "$5", fontSize: "$4" }}>"{quote}"</Box>
    <Flex
      css={{
        fontWeight: 500,
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: "auto",
        height: 75,
        "@bp2": {
          height: 90,
        },
      }}>
      <Box
        as="img"
        alt={`${author.name} avatar`}
        src={`/img/testimonials/${id}/avatar.png`}
        className="lazyload"
        css={{
          width: 56,
          height: 56,
          minWidth: 56,
          minHeight: 56,
          objectFit: "cover",
          objectPosition: "center",
          borderRadius: 1000,
          mr: "$3",
          "@bp2": {
            width: 72,
            height: 72,
            minWidth: 72,
            minHeight: 72,
          },
        }}
      />
      <Box>
        <Text css={{ fontWeight: 600 }}>{author.name}</Text>
        <Text css={{ fontWeight: 400 }}>
          {author.role}, {author.company}
        </Text>
      </Box>
    </Flex>
  </Box>
);

export default Card;
