/** @jsx jsx */
import { jsx } from "theme-ui";
import Link, { LinkProps } from "../Link";
import { Box } from "@theme-ui/components";

export type LinksListProps = {
  heading: string;
  links: LinkProps[];
};

const LinksList = ({ heading, links }: LinksListProps) => (
  <ul>
    <Box as="li" sx={{ fontWeight: 600, mb: 3 }}>
      {heading}
    </Box>
    {links.map((link, i) => (
      <Box
        as="li"
        key={`link-${link.href}-${i}`}
        sx={{ "&:not(:last-of-type)": { mb: 3 } }}>
        <Link {...link} variant="footer" />
      </Box>
    ))}
  </ul>
);

export default LinksList;
