import React from "react";
import NavigationBase from "./base";
import { FiPlay, FiServer, FiVideo } from "react-icons/fi";

const defaultNavProps = {
  links: [
    {
      label: "Product",
      href: "",
      children: [
        {
          href: "/on-demand",
          label: "On-demand",
          excerpt: "Build video into your product",
          icon: <FiPlay />,
        },
        {
          href: "/live",
          label: "Live",
          excerpt: "Livestream to millions",
          icon: <FiVideo />,
        },
        {
          href: "/transcoding",
          label: "Transcoding",
          excerpt: "Affordable and scalable transcoding",
          icon: <FiServer />,
        },
      ],
    },
    {
      label: "Customers",
      href: "/customers",
    },
    // {
    //   label: "Use Cases",
    //   href: "/use-cases",
    //   children: [
    //     {
    //       href: "/social-media",
    //       label: "Social Apps",
    //     },
    //     {
    //       href: "/creator-economy",
    //       label: "Creator Economy",
    //     },
    //   ],
    // },
    // {
    //   href: "/compare",
    //   label: "Compare",
    // },
    {
      href: "/pricing",
      label: "Pricing",
    },
    {
      href: "https://docs.livepeer.studio",
      label: "Docs",
      isExternal: true,
    },
    // {
    //   label: "Blog",
    //   href: "/blog",
    // },
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
