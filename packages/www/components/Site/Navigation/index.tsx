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
  ],
};

const DefaultNav = ({ navBackgroundColor = "$loContrast" }) => (
  <NavigationBase
    navBackgroundColor={navBackgroundColor}
    {...defaultNavProps}
  />
);

export { DefaultNav };
