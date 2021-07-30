import Link from "next/link";
import { Box, Text, Link as A } from "@livepeer.com/design-system";
import { ArrowRightIcon } from "@radix-ui/react-icons";

const Post = ({ href, title, label }) => (
  <Link href={href} passHref>
    <A>
      <Text variant="gray">{title}</Text>
      <Box>
        <Box as="span">{label ?? "Read guide"}</Box>
        <ArrowRightIcon />
      </Box>
    </A>
  </Link>
);

export default Post;
