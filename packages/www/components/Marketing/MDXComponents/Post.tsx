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
          transition: ".3s all",
          boxShadow:
            "0px 30px 30px rgb(0 0 0 / 2%), 0px 0px 8px rgb(0 0 0 / 3%), 0px 1px 0px rgb(0 0 0 / 5%)",
          "&:hover": {
            textDecoration: "none",
            transition: ".3s all",
            boxShadow: "0px 8px 32px rgb(0 0 0 / 12%)",
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
          <Heading size="1" as="h2">
            {title}
          </Heading>
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
