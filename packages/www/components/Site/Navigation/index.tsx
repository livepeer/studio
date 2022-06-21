import React, { useMemo, useState, useCallback, useEffect } from "react";
import NavigationBase from "./base";
import { useRouter } from "next/router";
import DocsMobileSubMenu from "./mobile/docs-submenu";
import { Tree } from "@components/Site/TableOfContents";
import { isMobile } from "react-device-detect";

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
      href: "/docs/guides",
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

type DocsNavProps = {
  tree?: Tree[];
  ignoreList?: string[];
};

const DocsNav = ({ tree, ignoreList }: DocsNavProps) => {
  const router = useRouter();
  const { pathname } = router;
  const [mobileSubmenuVisible, setMobileSubmenuVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState<number>();

  const handleScroll = useCallback(() => {
    const { scrollTop: currentScrollTop } = document.documentElement;
    setLastScrollTop(currentScrollTop);
    if (currentScrollTop > lastScrollTop) {
      setMobileSubmenuVisible(false);
    } else if (currentScrollTop < lastScrollTop) {
      setMobileSubmenuVisible(true);
    }
  }, [lastScrollTop]);

  useEffect(() => {
    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const docsNavProps = useMemo(
    () => ({
      links: [
        {
          href: "/docs/guides",
          children: "Docs",
        },
        {
          href: "/docs/api-reference",
          children: "API Reference",
        },
      ],
      breadcrumb: [
        {
          children: "Docs",
          href: "/docs/guides",
          mobileDropdownLinks: [
            {
              children: "Docs",
              href: "/docs/guides",
              isSelected: pathname === "/docs/guides",
            },
            {
              children: "API Reference",
              href: "/docs/api-reference",
              isSelected: pathname === "/docs/api-reference",
            },
          ],
        },
      ],
    }),
    [pathname]
  );

  return (
    <>
      <NavigationBase
        {...docsNavProps}
        withShadow={!mobileSubmenuVisible || !tree || !isMobile}
        css={tree ? { backgroundColor: "$panel" } : undefined}
      />
      {tree && (
        <DocsMobileSubMenu
          tree={tree}
          ignoreList={ignoreList}
          mobileSubmenuVisible={true}
        />
      )}
    </>
  );
};

export { DefaultNav, DocsNav };
