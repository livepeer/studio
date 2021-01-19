import { Box, Flex } from "@theme-ui/components";
import { Text } from "@theme-ui/components";
import { SxStyleProp } from "theme-ui";

export type TestimonialCardProps = {
  id: string;
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
  };
  pushSx?: SxStyleProp;
};

const TestimonialCard = ({
  id,
  quote,
  author,
  pushSx,
}: TestimonialCardProps) => (
  <Box
    sx={{
      position: "relative",
      bg: "background",
      py: 32,
      px: 24,
      borderRadius: 24,
      minHeight: [360, null, null, 380],
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      transition: "box-shadow .3s",
      boxShadow:
        "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
      ...pushSx,
    }}>
    <img
      alt={`${id} logo`}
      className="lazyload"
      src={`/img/testimonials/${id}/logo.svg`}
    />
    <Box sx={{ fontWeight: 400, my: 4, fontSize: 3 }}>"{quote}"</Box>
    <Flex
      sx={{
        fontWeight: 500,
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: "auto",
        height: [75, 90],
      }}>
      <img
        alt={`${author.name} avatar`}
        src={`/img/testimonials/${id}/avatar.png`}
        className="lazyload"
        sx={{
          width: [56, 72],
          height: [56, 72],
          minWidth: [56, 72],
          minHeight: [56, 72],
          objectFit: "cover",
          objectPosition: "center",
          borderRadius: 1000,
          mr: 2,
        }}
      />
      <Box>
        <Text sx={{ fontWeight: 600 }}>{author.name}</Text>
        <Text sx={{ fontWeight: 400 }}>
          {author.role}, {author.company}
        </Text>
      </Box>
    </Flex>
  </Box>
);

export default TestimonialCard;
