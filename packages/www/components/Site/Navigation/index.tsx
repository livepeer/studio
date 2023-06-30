import React from "react";
import NavigationBase from "./base";
const defaultNavProps = {
  links: [
    {
      href: "/#featured",
      children: "Featured",
    },

    {
      href: "/blog",
      children: "Blog",
    },
    {
      href: "https://docs.livepeer.studio",
      children: "Docs",
      isExternal: true,
    },
    {
      href: "https://discord.gg/7D6hGG6dCZ",
      children: "Join Discord",
      isExternal: true,
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
