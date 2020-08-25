import { Box, Flex } from "@theme-ui/components";
import imageUrlBuilder from "@sanity/image-url";
import client from "../../lib/client";
import { Text } from "@theme-ui/components";

const builder = imageUrlBuilder(client as any);

const TestimonialCard = ({
  companyLogo,
  quote,
  image,
  name,
  role,
  company,
  ...props
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        bg: "background",
        py: 32,
        px: 24,
        borderRadius: 24,
        height: [356, 407],
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between"
      }}
      {...props}
    >
      {companyLogo && (
        <img
          alt={companyLogo.alt}
          className="lazyload"
          data-src={builder.image(companyLogo).url()}
          width={companyLogo.asset.metadata.dimensions.width}
          height={companyLogo.asset.metadata.dimensions.height}
        />
      )}
      <Box sx={{ fontWeight: 400, mb: 4, fontSize: [3, 4] }}>"{quote}"</Box>
      <Flex
        sx={{
          fontWeight: 500,
          alignItems: "center",
          justifyContent: "flex-start",
          height: [75, 90]
        }}
      >
        <img
          alt={image.alt}
          className="lazyload"
          data-src={builder.image(image).url()}
          width={image.asset.metadata.dimensions.width}
          height={image.asset.metadata.dimensions.height}
          sx={{
            width: [56, 72],
            height: [56, 72],
            minWidth: [56, 72],
            minHeight: [56, 72],
            objectFit: "cover",
            objectPosition: "center",
            borderRadius: 1000,
            mr: 2
          }}
        />
        <Box>
          <Text sx={{ fontWeight: 600 }}>{name}</Text>
          <Text sx={{ fontWeight: 400 }}>
            {role}, {company}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default TestimonialCard;
