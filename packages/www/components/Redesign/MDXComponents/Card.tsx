import { Box } from "@livepeer.com/design-system";
import Link from "next/link";
import Image from "next/image";

const Card = ({ description, title, image, href }) => {
  return (
    <Link href={href} passHref>
      <a>
        <Box>
          <Box as="img" src={image} css={{ objectFit: "cover" }} />
        </Box>
        <Box as="span">{title}</Box>
        <Box as="span">{description}</Box>
      </a>
    </Link>
  );
};

export default Card;
