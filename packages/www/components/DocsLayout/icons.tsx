/** @jsx jsx */
import { jsx } from "theme-ui";

type IconProps = {
  id?: string;
};

type CollapseIconProps = {
  hovered: boolean;
};

const IconHouse = ({ id }: IconProps) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill={`url(#${id ?? "house"})`} />
      <path
        d="M7.5 10.5L12 7L16.5 10.5V16C16.5 16.2652 16.3946 16.5196 16.2071 16.7071C16.0196 16.8946 15.7652 17 15.5 17H8.5C8.23478 17 7.98043 16.8946 7.79289 16.7071C7.60536 16.5196 7.5 16.2652 7.5 16V10.5Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 17V12H13.5V17"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id={`${id ?? "house"}`}
          x1="0"
          y1="24"
          x2="24"
          y2="0"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#943CFF" />
          <stop offset="1" stopColor="#C57CFF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const IconApiReference = ({ id }: IconProps) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        width="24"
        height="24"
        rx="4"
        fill={`url(#${id ?? "apiReference"})`}
      />
      <path
        d="M14 15L17 12L14 9"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 9L7 12L10 15"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id={`${id ?? "apiReference"}`}
          x1="0"
          y1="24"
          x2="24"
          y2="0"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#002131" />
          <stop offset="1" stopColor="#005682" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const IconVideoGuides = ({ id }: IconProps) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        width="24"
        height="24"
        rx="4"
        fill={`url(#${id ?? "videoGuides"})`}
      />
      <path
        d="M9 8L16 12L9 16V8Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id={`${id ?? "videoGuides"}`}
          x1="0"
          y1="24"
          x2="24"
          y2="0"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#0096EB" />
          <stop offset="1" stopColor="#6AB8FF" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const Download = ({ hovered }: CollapseIconProps) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.16732 2.5L15.834 2.5M14.1673 11.6667L10.0007 7.5M10.0007 7.5L5.83398 11.6667M10.0007 7.5L10.0006 17.5"
        sx={{
          stroke: hovered ? "#000" : "#828282",
          transition: "0.2s",
        }}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { IconHouse, IconApiReference, IconVideoGuides, Download };
