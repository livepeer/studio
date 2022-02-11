import { Box, Link as A } from "@livepeer.com/design-system";
import Link from "next/link";

export type LinksListProps = {
  heading: string;
  links: Array<{
    children: string;
    href: string;
    target?: "_self" | "_blank";
  }>;
};

const LinksList = ({ heading, links }: LinksListProps) => (
  <Box>
    <Box css={{ fontWeight: 600, mb: "$3", color: "$hiContrast" }}>
      {heading}
    </Box>
    {links.map((link, i) => (
      <Box
        key={`link-${link.href}-${i}`}
        css={{ "&:not(:last-of-type)": { mb: "$3" } }}>
        <Link href={link.href} passHref>
          <A target={link.target ? link.target : "_self"}>{link.children}</A>
        </Link>
      </Box>
    ))}
  </Box>
);

export default LinksList;
