import React from "react";
import NavigationBase from "./base";
const defaultNavProps = {
  links: [
    {
      href: "https://docs.livepeer.studio",
      children: "Docs",
      isExternal: true,
    },
    {
      href: "/use-cases",
      children: "Use Cases",
    },
    {
      href: "/pricing",
      children: "Pricing",
    },
    {
      isExternal: true,
      href: "https://livepeer.typeform.com/to/HTuUHdDR#lead_source=Website%20-%20Contact%20an%20Expert&contact_owner=xxxxx",
      children: "Talk to an expert",
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
