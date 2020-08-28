import { SxStyleProp } from "theme-ui";

type Props = {
  id: string;
  pushSx?: SxStyleProp;
};

const VioletGradient = ({ id, pushSx }: Props) => (
  <svg
    width="2766"
    viewBox="0 0 2766 720"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    sx={{ height: "100%", ...pushSx }}
  >
    <g clipPath={`url(#${id}-violet-gradient-clip0)`}>
      <g opacity="0.25" filter={`url(#${id}-violet-gradient-filter0_f)`}>
        <circle
          cx="679.964"
          cy="-99.5985"
          r="492.5"
          transform="rotate(32.49 679.964 -99.5985)"
          fill="#F5B9FF"
        />
      </g>
      <g opacity="0.25" filter={`url(#${id}-violet-gradient-filter1_f)`}>
        <circle
          cx="1338.22"
          cy="-717.173"
          r="701"
          transform="rotate(32.49 1338.22 -717.173)"
          fill="#B0B0FF"
        />
      </g>
      <g opacity="0.25" filter={`url(#${id}-violet-gradient-filter2_f)`}>
        <circle
          cx="1372.76"
          cy="21.7571"
          r="544.5"
          transform="rotate(32.49 1372.76 21.7571)"
          fill="#BFA8FF"
        />
      </g>
      <g opacity="0.25" filter={`url(#${id}-violet-gradient-filter3_f)`}>
        <circle
          cx="2086.33"
          cy="-71.036"
          r="492.5"
          transform="rotate(32.49 2086.33 -71.036)"
          fill="#B0B0FF"
        />
      </g>
    </g>
    <defs>
      <filter
        id={`${id}-violet-gradient-filter0_f`}
        x="-160"
        y="-939.562"
        width="1679.93"
        height="1679.93"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur stdDeviation="80" result="effect1_foregroundBlur" />
      </filter>
      <filter
        id={`${id}-violet-gradient-filter1_f`}
        x="210.396"
        y="-1845"
        width="2255.65"
        height="2255.65"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur stdDeviation="80" result="effect1_foregroundBlur" />
      </filter>
      <filter
        id={`${id}-violet-gradient-filter2_f`}
        x="461"
        y="-890"
        width="1823.51"
        height="1823.51"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur stdDeviation="80" result="effect1_foregroundBlur" />
      </filter>
      <filter
        id={`${id}-violet-gradient-filter3_f`}
        x="1246.36"
        y="-911"
        width="1679.93"
        height="1679.93"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur stdDeviation="80" result="effect1_foregroundBlur" />
      </filter>
      <clipPath id={`${id}-violet-gradient-clip0`}>
        <rect width="2766" height="720" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default VioletGradient;
