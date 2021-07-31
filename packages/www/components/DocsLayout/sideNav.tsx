import { useState, useEffect } from "react";
import Collapsible from "react-collapsible";
import { useRouter } from "next/router";
import Link from "next/link";
import { Box, Flex, Text, Link as A } from "@livepeer.com/design-system";
import { ChevronDownIcon } from "@radix-ui/react-icons";

type SideNavProps = {
  hideTopNav: boolean;
  hideSideBar: boolean;
  setHideSideBar: React.Dispatch<React.SetStateAction<boolean>>;
};

type Child = {
  title: string;
  description: string;
  slug: string;
  hide: boolean;
  children: {
    title: string;
    description: string;
    slug: string;
  }[];
};

type MenuProps = {
  menu: {
    title: string;
    description: string;
    slug: string;
    children: Child[];
  }[];
};

type MobileSideNavProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type TriggerProps = {
  label: string;
  isOpen: boolean;
  isSelected: boolean;
};

const Trigger = ({ label, isOpen, isSelected }: TriggerProps) => {
  return (
    <Box
      css={{
        display: "flex",
        alignItems: "flex-start",
        cursor: "pointer",
        minHeight: "fit-content",
        pl: "$4",
        my: "$2",
        position: "relative",
      }}>
      <Box
        css={{
          position: "absolute",
          left: 0,
          width: 4,
          height: "100%",
          transition: "all 0.2s",
          backgroundColor: isSelected ? "$violet9" : "transparent",
          borderRadius: " 0 2px 2px 0",
        }}
      />
      <Box
        css={{
          fontWeight: isSelected ? 600 : 400,
          transition: "all 0.2s",
          mr: "$2",
          fontSize: "$3",
          letterSpacing: "-0.02em",
        }}>
        {label}
      </Box>
      <Box
        css={{
          transform: isOpen ? "rotate(-90deg)" : "",
          transition: "all 0.1s",
          mt: "3px",
        }}>
        <ChevronDownIcon />
      </Box>
    </Box>
  );
};

const CollapsibleMenuItem = ({ route }: { route: Child }) => {
  const router = useRouter();
  const currentPath = router.asPath
    .split("#")[0]
    .split("/")
    .slice(0, 5)
    .join("/");
  const currentPathSection = router.asPath
    .split("#")[0]
    .split("/")
    .slice(0, 4)
    .join("/");

  const [isOpen, setIsOpen] = useState(currentPathSection === `/${route.slug}`);

  return (
    <Collapsible
      handleTriggerClick={() => setIsOpen((p) => !p)}
      open={isOpen}
      transitionTime={200}
      trigger={
        <Trigger
          isOpen={isOpen}
          label={route.title}
          isSelected={currentPathSection === `/${route.slug}`}
        />
      }>
      <Box css={{ pt: 0, pb: "$4", background: "none" }}>
        {route.children.map((child, idx2) => (
          <Link href={`/${child.slug}`} key={idx2} passHref>
            <A
              variant="subtle"
              css={{
                py: "$2",
                textDecoration: "none",
                display: "block",
                fontSize: "$3",
                letterSpacing: "-0.02em",
                transition: "color .3s",
                color:
                  currentPath === `/${child.slug}` ? "$violet11" : "$mauve11",
                ml: "$7",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "none",
                  color: "white",
                  transition: "color .3s",
                },
              }}>
              {child.title}
            </A>
          </Link>
        ))}
      </Box>
    </Collapsible>
  );
};

const Menu = ({ menu }: MenuProps) => {
  const router = useRouter();
  const currentPath = router.asPath
    .split("#")[0]
    .split("/")
    .slice(0, 5)
    .join("/");

  return (
    <Flex
      direction="column"
      css={{
        mt: "$4",
      }}>
      {menu[0]?.children.map((route, idx) =>
        route.children.length > 0 ? (
          <CollapsibleMenuItem route={route} key={idx} />
        ) : (
          !route.hide && (
            <Link href={`/${route.slug}`} key={idx} passHref>
              <Box
                as="a"
                css={{
                  display: "block",
                  color:
                    currentPath === `/${route.slug}`
                      ? "$violet11"
                      : "$hiContrast",
                  textDecoration: "none",
                  fontSize: "$3",
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  position: "relative",
                  fontWeight: currentPath === `/${route.slug}` ? 600 : 400,
                  pl: "$4",
                  my: "$2",
                }}>
                <Box
                  css={{
                    position: "absolute",
                    left: 0,
                    width: 4,
                    height: "100%",
                    transition: "all 0.2s",
                    background:
                      currentPath === `/${route.slug}`
                        ? "$violet9"
                        : "transparent",
                  }}
                />
                <Box>{route.title}</Box>
              </Box>
            </Link>
          )
        )
      )}
    </Flex>
  );
};

const SideNav = ({
  hideTopNav,
  hideSideBar,
  setHideSideBar,
  menu,
}: SideNavProps & MenuProps) => {
  return (
    <Box
      css={{
        height: "calc(100vh - 72px)",
        overflowY: "auto",
        justifyContent: "space-between",
        position: "sticky",
        marginLeft: hideSideBar ? -258 : 0,
        transition: "all 0.2s",
        top: 72,
        display: "none",
        "@bp2": {
          display: "flex",
        },
      }}>
      <Box
        css={{
          width: 258,
          minWidth: 258,
          maxWidth: 258,
        }}>
        <Menu menu={menu} />
      </Box>
      <Box
        css={{
          height: "100vh",
          borderRight: "1px solid $colors$mauve5",
          pt: "$5",
          transition: "all 0.2s",
          width: "60px",
          minWidth: "60px",
          display: "flex",
          justifyContent: "center",
        }}>
        <Box
          onClick={() => setHideSideBar(!hideSideBar)}
          css={{
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxHeight: "22px",
            height: "22px",
            width: "22px",
            transform: hideSideBar ? "rotate(-270deg)" : "rotate(-90deg)",
          }}>
          <Box
            as="svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <Box
              as="path"
              d="M4.16732 2.5L15.834 2.5M14.1673 11.6667L10.0007 7.5M10.0007 7.5L5.83398 11.6667M10.0007 7.5L10.0006 17.5"
              css={{
                stroke: "$hiContrast",
                transition: "0.2s",
              }}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const MobileSideNav = ({
  menu,
  isOpen,
  setIsOpen,
}: MobileSideNavProps & MenuProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
    }
  }, [isOpen]);

  return (
    <Box
      css={{
        height: "100vh",
        width: isOpen ? "100vw" : "0px",
        overflowX: "hidden",
        transition: "all 0.2s",
        position: "fixed",
        zIndex: 100,
        top: 0,
        left: 0,
        display: "flex",
        "@bp2": {
          display: "none",
        },
      }}>
      <Box
        onClick={() => setIsOpen(false)}
        css={{
          position: "fixed",
          bc: "$panel",
          height: "100vh",
          width: "100vw",
          transition: "all 0.2s",
          top: 0,
          zIndex: 1,
          right: 0,
          opacity: isOpen ? "1" : "0",
          visibility: isOpen ? "visible" : "hidden",
        }}
      />
      <Box
        css={{
          bc: "$panel",
          padding: "24px 38px 24px 0",
          maxWidth: "100%",
          paddingBottom: "120px",
          overflow: "auto",
          zIndex: 100,
        }}>
        <Menu menu={menu} />
      </Box>
    </Box>
  );
};

export default SideNav;
