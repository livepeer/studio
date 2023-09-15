import React from "react";
import NavigationBase from "./base";
const defaultNavProps = {
  links: [
    {
      label: "Use Cases",
      href: "/use-cases",
      children: [
        {
          href: "/social-media",
          label: "Social Apps",
        },
        {
          href: "/creator-economy",
          label: "Creator Economy",
        },
      ],
    },
    {
      href: "/pricing",
      label: "Pricing",
    },
    {
      href: "https://docs.livepeer.studio",
      label: "Docs",
      isExternal: true,
    },
    {
      isExternal: true,
      href: "https://livepeer.typeform.com/to/HTuUHdDR#lead_source=Website%20-%20Contact%20an%20Expert&contact_owner=xxxxx",
      label: "Talk to an expert",
    },
  ],
};

const DefaultNav = ({ navBackgroundColor = "$loContrast" }) => (
  <NavigationBase
    navBackgroundColor={navBackgroundColor}
    {...defaultNavProps}
  />
);

export { DefaultNav };
