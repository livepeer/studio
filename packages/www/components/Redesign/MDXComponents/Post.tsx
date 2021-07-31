import { Box, Heading, Text, Link as A } from "@livepeer.com/design-system";
import Link from "next/link";
import Image from "next/image";

const Card = ({ description, title, image, href }) => {
  return (
    <Link href={href} passHref>
      <A
        css={{
          borderRadius: 16,
          border: "1px solid $colors$mauve5",
          textDecoration: "none",
          boxShadow: "none",
          transition: ".3s all",
          "&:hover": {
            textDecoration: "none",
            transition: ".3s all",
            boxShadow:
              "0px 2px 1px rgba(0, 0, 0, 0.3), 0px 16px 40px rgba(0, 0, 0, 0.3)",
          },
        }}>
        <Box
          css={{
            borderTopRightRadius: 16,
            borderTopLeftRadius: 16,
            overflow: "hidden",
          }}>
          {image && (
            <Image
              src={image}
              layout="responsive"
              objectFit="cover"
              width={372}
              height={272}
            />
          )}
        </Box>
        <Box css={{ p: "$4" }}>
          <Heading size="1">{title}</Heading>
          {description && (
            <Text variant="gray" css={{ mt: "$1" }}>
              {description}
            </Text>
          )}
        </Box>
      </A>
    </Link>
  );
};

export default Card;
