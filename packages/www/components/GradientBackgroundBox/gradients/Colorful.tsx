import { SxStyleProp } from "theme-ui";

type Props = {
  id: string;
  pushSx?: SxStyleProp;
};

const ColorfulGradient = ({ id, pushSx }: Props) => (
  <svg
    width="1919"
    viewBox="0 0 1919 720"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    sx={{ height: "100%", ...pushSx }}
  >
    <g clipPath={`url(#${id}-colorful-gradient-clip0)`}>
      <g filter={`url(#${id}-colorful-gradient-filter0_f)`}>
        <ellipse
          cx="823"
          cy="-41.9999"
          rx="584"
          ry="584"
          transform="rotate(-180 823 -41.9999)"
          fill={`url(#${id}-colorful-gradient-paint0_linear)`}
        />
      </g>
      <g opacity="0.6" filter={`url(#${id}-colorful-gradient-filter1_f)`}>
        <ellipse
          cx="1452"
          cy="-47"
          rx="276"
          ry="276"
          fill={`url(#${id}-colorful-gradient-paint1_linear)`}
        />
      </g>
      <g opacity="0.6" filter={`url(#${id}-colorful-gradient-filter2_f)`}>
        <ellipse
          cx="467"
          cy="-47"
          rx="276"
          ry="276"
          fill={`url(#${id}-colorful-gradient-paint2_linear)`}
        />
      </g>
    </g>
    <defs>
      <filter
        id={`${id}-colorful-gradient-filter0_f`}
        x="-11.0002"
        y="-876"
        width="1668"
        height="1668"
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
        <feGaussianBlur stdDeviation="125" result="effect1_foregroundBlur" />
      </filter>
      <filter
        id={`${id}-colorful-gradient-filter1_f`}
        x="926"
        y="-573"
        width="1052"
        height="1052"
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
        <feGaussianBlur stdDeviation="125" result="effect1_foregroundBlur" />
      </filter>
      <filter
        id={`${id}-colorful-gradient-filter2_f`}
        x="-59"
        y="-573"
        width="1052"
        height="1052"
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
        <feGaussianBlur stdDeviation="125" result="effect1_foregroundBlur" />
      </filter>
      <linearGradient
        id={`${id}-colorful-gradient-paint0_linear`}
        x1="960.673"
        y1="-350.654"
        x2="823"
        y2="542"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#EACFE8" stopOpacity="0.1" />
        <stop offset="1" stopColor="#943CFF" />
      </linearGradient>
      <linearGradient
        id={`${id}-colorful-gradient-paint1_linear`}
        x1="1452"
        y1="-323"
        x2="1452"
        y2="229"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FDFFA8" />
        <stop offset="1" stopColor="#F5B9FF" />
      </linearGradient>
      <linearGradient
        id={`${id}-colorful-gradient-paint2_linear`}
        x1="467"
        y1="-323"
        x2="467"
        y2="229"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FDFFA8" />
        <stop offset="1" stopColor="#F5B9FF" />
      </linearGradient>
      <clipPath id={`${id}-colorful-gradient-clip0`}>
        <rect width="1919" height="720" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default ColorfulGradient;
