import { transform } from "@babel/core";
import { useState } from "react";
import { Download } from "./icons";
import { keyframes } from "@emotion/react";

type SideNavProps = {
  hideTopNav: boolean;
  hideSideBar: boolean;
  setHideSideBar: React.Dispatch<React.SetStateAction<boolean>>;
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

const SideNav = ({ hideTopNav, hideSideBar, setHideSideBar }: SideNavProps) => {
  return (
    <div
      sx={{
        height: `calc(100vh - ${hideTopNav ? "76px" : "136px"})`,
        display: ["none", "flex", "flex"],
        position: "relative",
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
