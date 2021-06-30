/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState, useEffect } from "react";
import { Download } from "./icons";
import Collapsible from "react-collapsible";
import { useRouter } from "next/router";
import { TiArrowSortedDown } from "react-icons/ti";
import Link from "next/link";
import Marked from "./Marked";

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
    <div
      sx={{
        display: "flex",
        alignItems: "flex-start",
        cursor: "pointer",
        background: "white",
        minHeight: "fit-content",
        pl: "24px",
        position: "relative",
      }}>
      <div
        sx={{
          position: "absolute",
          left: "0",
          width: "4px",
          height: "100%",
          transition: "all 0.2s",
          background: isSelected ? "#943CFF" : "transparent",
          borderRadius: " 0 2px 2px 0",
        }}
      />
      <div
        sx={{
          fontWeight: isSelected ? "600" : "400",
          transition: "all 0.2s",
          mr: "8px",
          fontSize: "14px",
          letterSpacing: "-0.02em",
          color: "#3C3C3C",
          ":hover": {
            color: "#000000",
          },
        }}>
        <Marked>{label}</Marked>
      </div>
      <i
        sx={{
          transform: isOpen ? "rotate(-90deg)" : "",
          transition: "all 0.1s",
          mt: "6px",
        }}>
        <TiArrowSortedDown color="#AFAFAF" size={12} />
      </i>
    </div>
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
      sx={{ background: "none", mt: "16px" }}
      trigger={
        <Trigger
          isOpen={isOpen}
          label={route.title}
          isSelected={currentPathSection === `/${route.slug}`}
        />
      }>
      {route.children.map((child, idx2) => (
        <Link href={`/${child.slug}`} key={idx2} passHref>
          <a
            sx={{
              fontSize: "14px",
              letterSpacing: "-0.02em",
              color: currentPath === `/${child.slug}` ? "#943CFF" : "#777777",
              ml: "48px !important",
              mt: "16px !important",
              transition: "all 0.2s",
              cursor: "pointer",
              ":hover": {
                color: "#000000",
              },
            }}>
            <Marked>{child.title}</Marked>
          </a>
        </Link>
      ))}
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
    <div
      sx={{
        mt: "8px",
        display: "flex",
        flexDirection: "column",
      }}>
      {menu[0]?.children.map((route, idx) =>
        route.children.length > 0 ? (
          <CollapsibleMenuItem route={route} key={idx} />
        ) : (
          !route.hide && (
            <Link href={`/${route.slug}`} key={idx} passHref>
              <a
                sx={{
                  fontSize: "14px",
                  letterSpacing: "-0.02em",
                  color: "#3C3C3C",
                  mt: "16px !important",
                  cursor: "pointer",
                  position: "relative",
                  fontWeight: currentPath === `/${route.slug}` ? "600" : "400",
                  pl: "24px",
                }}>
                <div
                  sx={{
                    position: "absolute",
                    left: "0",
                    width: "4px",
                    height: "100%",
                    transition: "all 0.2s",
                    background:
                      currentPath === `/${route.slug}`
                        ? "#943CFF"
                        : "transparent",
                    borderRadius: " 0 2px 2px 0",
                  }}
                />
                <span
                  sx={{
                    color: "#3C3C3C",
                    ":hover": {
                      color: "#000000",
                    },
                  }}>
                  <Marked>{route.title}</Marked>
                </span>
              </a>
            </Link>
          )
        )
      )}
    </div>
  );
};

const SideNav = ({
  hideTopNav,
  hideSideBar,
  setHideSideBar,
  menu,
}: SideNavProps & MenuProps) => {
  const [iconHover, setIconHover] = useState(false);
  return (
    <div
      sx={{
        height: `calc(100vh - ${hideTopNav ? "76px" : "136px"})`,
        overflowY: "auto",
        display: ["none", "none", "flex", "flex"],
        justifyContent: "space-between",
        position: "sticky",
        marginTop: hideTopNav ? "-60px" : "",
        marginLeft: hideSideBar ? "-233px" : "0px",
        transition: "all 0.2s",
        background: "white",
        top: hideTopNav ? 76 : 136,
      }}>
      <div
        sx={{
          width: "233px",
          minWidth: "233px",
          maxWidth: "233px",
          padding: "24px 0",
        }}>
        <p
          sx={{
            fontSize: "10px",
            color: "#4F4F4F",
            letterSpacing: "0.08em",
            fontWeight: "bold",
            ml: "24px",
            mt: "8px",
          }}>
          CONTENT
        </p>
        <Menu menu={menu} />
      </div>
      <div
        sx={{
          borderRight: "1px solid #E6E6E6",
          height: "100%",
          pt: "24px",
          transition: "all 0.2s",
          width: "60px",
          minWidth: "60px",
          display: "flex",
          justifyContent: "center",
        }}>
        <i
          onClick={() => setHideSideBar(!hideSideBar)}
          onMouseOver={() => setIconHover(true)}
          onMouseOut={() => setIconHover(false)}
          sx={{
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
          <Download hovered={iconHover} />
        </i>
      </div>
    </div>
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
    <div
      sx={{
        display: ["flex", "flex", "none", "none"],
        height: "100vh",
        width: isOpen ? "100vw" : "0px",
        overflowX: "hidden",
        transition: "all 0.2s",
        position: "fixed",
        zIndex: 100,
        top: 0,
        left: 0,
      }}>
      <div
        onClick={() => setIsOpen(false)}
        sx={{
          position: "fixed",
          background: "rgba(0, 0, 0, 0.32)",
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
      <div
        sx={{
          padding: "24px 38px 24px 0",
          maxWidth: "100%",
          background: "white",
          paddingBottom: "120px",
          overflow: "auto",
          zIndex: 100,
        }}>
        <p
          sx={{
            fontSize: "10px",
            color: "#4F4F4F",
            letterSpacing: "0.08em",
            fontWeight: "bold",
            ml: "24px",
            mt: "8px",
          }}>
          CONTENT
        </p>
        <Menu menu={menu} />
      </div>
    </div>
  );
};

export default SideNav;
