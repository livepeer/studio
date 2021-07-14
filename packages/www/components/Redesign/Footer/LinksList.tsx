import { Box, Link as A } from "@livepeer.com/design-system";
import Link from "next/link";

export type LinksListProps = {
  heading: string;
  links: any;
};

const LinksList = ({ heading, links }: LinksListProps) => (
  <Box>
    <Box css={{ fontWeight: 600, mb: "$3" }}>{heading}</Box>
    {links.map((link, i) => (
      <Box
        key={`link-${link.href}-${i}`}
        css={{ "&:not(:last-of-type)": { mb: "$3" } }}>
        <Link href={link.href} passHref>
          <A>{link.children}</A>
        </Link>
      </Box>
    ))}
  </Box>
);

export default LinksList;
