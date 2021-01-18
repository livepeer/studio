import Link, { LinkProps } from "../Link";

export type LinksListProps = {
  heading: string;
  links: LinkProps[];
};

const LinksList = ({ heading, links }: LinksListProps) => (
  <ul>
    <li sx={{ fontWeight: 600, mb: 3 }}>{heading}</li>
    {links.map((link, i) => (
      <li
        key={`link-${link.href}-${i}`}
        sx={{ "&:not(:last-of-type)": { mb: 3 } }}>
        <Link {...link} variant="footer" />
      </li>
    ))}
  </ul>
);

export default LinksList;
