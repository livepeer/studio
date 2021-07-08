/** @jsx jsx */
import { jsx } from "theme-ui";
import { Box } from "@theme-ui/components";

const BlogPostImage = ({ pushSx, ...imageProps }: any) => (
  <Box
    as="span"
    sx={{
      position: "relative",
      width: "100vw",
      left: "50%",
      maxHeight: [200, 300, "initial"],
      transform: "translateX(-50%)",
      display: "flex",
      justifyContent: "center",
      px: "16px",
      my: 4,
      ...pushSx,
    }}>
    <Box
      as="img"
      {...imageProps}
      sx={{
        borderStyle: "none",
        maxWidth: "854px",
        width: "100%",
        boxSizing: "initial",
        bg: "background",
        borderRadius: ["16px", "24px"],
        objectFit: "cover",
        '&[align="right"]': {
          pl: "20px",
        },
        '&[align="left"]': {
          pr: "20px",
        },
      }}
    />
  </Box>
);

export default BlogPostImage;
