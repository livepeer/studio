import Link from "next/link";
import { BsArrowRightShort } from "react-icons/bs";

type CardProps = {
  title: string;
  href: string;
  label?: string;
}

type SimpleCardProps = {
  description: string;
  title: string;
  href: string;
  label?: string;
};

const IconHouse = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="url(#paint0_linear)" />
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
          id="paint0_linear"
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

const IconApiReference = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="url(#paint1_linear)" />
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
          id="paint1_linear"
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

const IconVideoGuides = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="url(#paint2_linear)" />
      <path
        d="M9 8L16 12L9 16V8Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="paint2_linear"
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

const Download = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.16732 2.5L15.834 2.5M14.1673 11.6667L10.0007 7.5M10.0007 7.5L5.83398 11.6667M10.0007 7.5L10.0006 17.5"
        stroke="#828282"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SimpleCard = ({ title, description, href, label }: SimpleCardProps) => {
  return (
    <div
      sx={{
        background: "linear-gradient(212.62deg, #B75EFF 0%, #943CFF 100%)",
        minHeight: "272px",
        padding: "32px 24px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.2s",
        width: "100%",
        borderRadius: "16px",
        ":hover": {
          boxShadow:
            "0px 2px 2px rgba(0, 0, 0, 0.2), 0px 0px 8px rgba(0, 0, 0, 0.03), 0px 30px 30px rgba(0, 0, 0, 0.02)",
        },
      }}>
      <div>
        <p
          sx={{
            mb: "16px",
            fontWeight: "600",
            fontSize: "18px",
            lineHeight: "24px",
            letterSpacing: "-0.03em",
            color: "white",
          }}>
          {title}
        </p>
        <p
          sx={{
            fontSize: "16px",
            color: "white",
            lineHeight: "28px",
            letterSpacing: "-0.02em",
          }}>
          {description}
        </p>
      </div>
      <Link href={href}>
        <a
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            maxWidth: "fit-content",
            mt: "32px",
          }}>
          <span
            sx={{
              mr: "8px",
              color: "white",
              fontWeight: "600",
              fontSize: '16px',
              letterSpacing: "-0.02em",
            }}>
            {label ?? "Read guide"}
          </span>
          <BsArrowRightShort color="white" size={24} />
        </a>
      </Link>
    </div>
  );
};

const NavigationCard = ({ title, href, label }: CardProps) => {
  return (
    <div
      sx={{
        width: "100%",
        padding: "24px",
        border: "1px solid #E6E6E6",
        minHeight: "152px",
        display: "flex",
        flexDirection: "column",
        borderRadius: '16px'
      }}>
      <p
        sx={{
          letterSpacing: "-0.03em",
          fontSize: "14px",
          fontWeight: "600",
          lineHeight: "24px",
        }}>
        {title}
      </p>
      <Link href={href}>
        <a
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            maxWidth: "fit-content",
            mt: "32px",
          }}>
          <span
            sx={{
              mr: "8px",
              color: "#943CFF",
              fontWeight: "600",
              fontSize: '14px',
              letterSpacing: "-0.02em",
            }}>
            {label ?? "Read guide"}
          </span>
          <BsArrowRightShort color="#943CFF" size={22} />
        </a>
      </Link>
    </div>
  );
};

export { IconHouse, IconApiReference, IconVideoGuides, Download, SimpleCard, NavigationCard };
