import React, { useMemo, useState, useCallback, useEffect } from "react";
import NavigationBase from "./base";
import { useRouter } from "next/router";
import DocsMobileSubMenu from "./mobile/docs-submenu";
import { Tree } from "components/TableOfContents";
import { isMobile } from "react-device-detect";
import NavDropdown from "components/Redesign/NavDropdown";
import { Box, Text, Flex, styled } from "@livepeer.com/design-system";
import Link from "next/link";
import ArrowLink from "../ArrowLink";
import { CubeIcon, VideoIcon } from "@radix-ui/react-icons";

type NavProps = React.ComponentProps<typeof NavigationBase>;

const StyledVideoIcon = styled(VideoIcon, {});

const StyledEcommerceIcon = ({ active = false, ...props }) => {
  return (
    <Box
      as="svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Box
        as="path"
        fill="currentColor"
        fill-rule="evenodd"
        d="M5.43 6L5.1 7.22a3 3 0 0 0 5.8 1.56L11.64 6H15a1 1 0 0 1 0 2l-.9 7.11a1 1 0 0 1-1 .89H2.9a1 1 0 0 1-1-.89L1 8a1 1 0 1 1 0-2h4.43zM9.61.02l.97.26a.5.5 0 0 1 .35.6L9.57 6l-.6 2.26a1 1 0 0 1-1.94-.52l2-7.45a.5.5 0 0 1 .58-.27z"
      />
    </Box>
  );
};

const StyledPlatformsIcon = ({ ...props }) => (
  <Box
    as="svg"
    width="14"
    height="16"
    viewBox="0 0 14 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <path
      d="M6.98 0a.52.52 0 0 0-.25.08L.24 4.03a.5.5 0 0 0-.24.43c0 .17.1.33.24.42l6.49 3.95c.17.1.37.1.54 0l6.49-3.95a.5.5 0 0 0 .24-.42.5.5 0 0 0-.24-.43L7.27.08a.52.52 0 0 0-.3-.08zm-5.5 6.82l-1.24.76A.5.5 0 0 0 0 8c0 .17.1.33.24.42l6.49 3.96c.17.1.37.1.54 0l6.49-3.96A.5.5 0 0 0 14 8a.5.5 0 0 0-.24-.42l-1.25-.76-4.7 2.86a1.58 1.58 0 0 1-1.62 0l-4.7-2.86zm0 3.54l-1.24.76a.5.5 0 0 0-.24.43c0 .17.1.33.24.42l6.49 3.95c.17.1.37.1.54 0l6.49-3.95a.5.5 0 0 0 .24-.42.5.5 0 0 0-.24-.43l-1.25-.76-4.7 2.87a1.58 1.58 0 0 1-1.62 0l-4.7-2.87z"
      fill="currentColor"
      fill-rule="nonzero"></path>
  </Box>
);

const defaultNavProps: NavProps = {
  links: [
    {
      href: "/use-cases",
      children: (
        <NavDropdown
          trigger={
            <Box
              css={{
                fontSize: "$3",
                fontWeight: 600,
                textDecoration: "none",
                mx: "$3",
                cursor: "pointer",
              }}>
              Use Cases
            </Box>
          }>
          <Box css={{ mb: "$3" }}>
            <Flex>
              <StyledPlatformsIcon css={{ mt: "4px", mr: "$3" }} />
              <Box>
                <Text css={{ fontWeight: 600, mb: "$2" }}>
                  Streaming Platforms
                </Text>
                <Box css={{ color: "$mauve5" }}>
                  <ArrowLink
                    hideArrow
                    color="$mauve9"
                    href="/use-cases/creators">
                    <Text variant="gray" css={{ py: "$1" }}>
                      For Creators
                    </Text>
                  </ArrowLink>
                  <ArrowLink hideArrow color="$mauve9" href="/use-cases/gamers">
                    <Text variant="gray" css={{ py: "$1" }}>
                      For Gamers
                    </Text>
                  </ArrowLink>
                  <ArrowLink
                    hideArrow
                    color="$mauve9"
                    href="/use-cases/musicians">
                    <Text variant="gray" css={{ py: "$1" }}>
                      For Musicians
                    </Text>
                  </ArrowLink>
                </Box>
              </Box>
            </Flex>
          </Box>
          <Box>
            <Flex>
              <StyledEcommerceIcon
                css={{ mt: "1px", mr: "$3", width: 14, height: 14 }}
              />
              <ArrowLink
                hideArrow
                href="/use-cases/ecommerce"
                css={{ fontWeight: 600, mb: "$2", fontSize: "$3" }}>
                Ecommerce
              </ArrowLink>
            </Flex>
          </Box>
        </NavDropdown>
      ),
    },
    {
      href: "/docs/guides",
      children: "Docs",
    },
    {
      href: "/blog",
      children: "Blog",
    },
    {
      href: "/pricing",
      children: "Pricing",
    },
    {
      href: "/contact",
      children: "Contact",
    },
  ],
};

const DefaultNav = ({ hideGuides = false }) => (
  <NavigationBase hideGuides={hideGuides} {...defaultNavProps} />
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

  const docsNavProps: NavProps = useMemo(
    () => ({
      links: [
        {
          href: "/docs/guides",
          children: "Overview",
        },
        {
          href: "/docs/guides",
          children: "Guides",
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
              children: "Overview",
              href: "/docs/guides",
              isSelected: pathname === "/docs",
            },
            {
              children: "Guides",
              href: "/docs/vide-guides",
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
