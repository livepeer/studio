import { useState } from "react";
import { Download } from "./icons";
import { keyframes } from "@emotion/react";
import Collapsible from "react-collapsible";
import { useRouter } from "next/router";
import { TiArrowSortedDown } from "react-icons/ti";

type SideNavProps = {
  hideTopNav: boolean;
  hideSideBar: boolean;
  setHideSideBar: React.Dispatch<React.SetStateAction<boolean>>;
};

type MenuProps = {
  menu: {
    title: string;
    description: string;
    slug: string;
    children: {
      title: string;
      description: string;
      slug: string;
      children: {
        title: string;
        description: string;
        slug: string;
      }[];
    }[];
  }[];
};

type TriggerProps = {
  label: string;
};

const Trigger = ({ label }: TriggerProps) => {
  return (
    <div
      sx={{
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        background: "white",
      }}>
      <p
        sx={{
          mr: "8px",
          fontSize: "14px",
          letterSpacing: "-0.02em",
          color: "#3C3C3C",
        }}>
        {label}
      </p>
      <TiArrowSortedDown color="#AFAFAF" size={12} />
    </div>
  );
};

const Menu = ({ menu }: MenuProps) => {
  return (
    <div
      sx={{
        mt: "24px",
        pl: "24px",
        display: "flex",
        flexDirection: "column",
      }}>
      {menu[0].children.map((route, idx) => (
        <Collapsible
          transitionTime={200}
          sx={{ background: "none" }}
          key={idx}
          trigger={<Trigger label={route.title} />}>
          {route.children.map((child, idx2) => (
            <p
              key={idx2}
              sx={{
                fontSize: "14px",
                letterSpacing: "-0.02em",
                color: "#3C3C3C",
                ml: '24px !important',
                mt: '16px !important',
                cursor: 'pointer'
              }}>
              {child.title}
            </p>
          ))}
        </Collapsible>
      ))}
    </div>
  );
};

const fadeOut = keyframes`
  0% {
    position: unset;
    left: 0;
  }
  100% {
    position: absolute;
    left: -230px;
  }
`;
const fadeIn = keyframes`
  0% {
    position: absolute;
    left: -230px;
  }
  100% {
    position: unset;
    left: 0;
  }
`;

const SideNav = ({
  hideTopNav,
  hideSideBar,
  setHideSideBar,
  menu,
}: SideNavProps & MenuProps) => {
  const router = useRouter();
  const currentMenu = menu.filter((a) => `/${a.slug}` === router.asPath);
  return (
    <div
      sx={{
        height: `calc(100vh - ${hideTopNav ? "76px" : "136px"})`,
        display: ["none", "none", "flex", "flex"],
        position: "sticky",
        gridColumn: hideSideBar
          ? [null, null, "1 / 2", "1 / 2"]
          : [null, null, "1 / 5", "1 / 4"],
        marginTop: hideTopNav ? "-60px" : "",
        transition: "all 0.2s",
        background: "white",
        top: hideTopNav ? 76 : 136,
      }}>
      <div
        sx={{
          animation: hideSideBar ? fadeOut : fadeIn,
          animationDuration: "0.2s",
          animationFillMode: "forwards",
          transition: "all 0.2s",
          padding: "24px 0",
          width: "202px",
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
        <Menu menu={currentMenu} />
      </div>
      <div
        sx={{
          borderRight: "1px solid #E6E6E6",
          height: "100%",
          padding: "24px",
          transition: "all 0.2s",
        }}>
        <i
          onClick={() => setHideSideBar(!hideSideBar)}
          sx={{
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            transform: hideSideBar ? "rotate(-270deg)" : "rotate(-90deg)",
          }}>
          <Download />
        </i>
      </div>
    </div>
  );
};

export default SideNav;
