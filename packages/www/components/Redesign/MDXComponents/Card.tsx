import { Box, Heading, Text, Link as A } from "@livepeer.com/design-system";
import Link from "next/link";
import Image from "next/image";

const Card = ({ description, title, image, href }) => {
  return (
    <Link href={href} passHref>
      <A css={{ textDecoration: "none" }}>
        <Box css={{ mb: "$4", borderRadius: 16, overflow: "hidden" }}>
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
        <Heading>{title}</Heading>
        <Text variant="gray">{description}</Text>
      </A>
    </Link>
  );
};

export default Card;
