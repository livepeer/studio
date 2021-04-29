import Link from "next/link";
import { ReactNode } from "react";

export type PricingCard = {
  pricingTitle: string;
  titleColor?: string;
  cardBg: string;
  pricingDescription: string;
  btn: {
    display: string;
    bg?: string;
    color?: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean
  };
  children: ReactNode;
  className?: string;
};

export type PricingCardContentProps = {
  children?: ReactNode;
  comingSoon?: boolean;
  color?: string;
  customPricing?: boolean;
};

const CheckIcon = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 6L9 17L4 12"
        stroke="#943CFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const PricingCardContent = ({
  children,
  comingSoon,
  color,
  customPricing,
}: PricingCardContentProps) => {
  return (
    <div
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "112px",
        py: "12px",
        justifyContent: "center",
        borderTop: color
          ? "1px solid rgba(225, 225, 225, 0.2)"
          : "1px solid rgba(0, 0, 0, 0.08)",
        color: color ?? "black",
      }}>
      {children}
      {comingSoon ? (
        <p
          sx={{
            fontSize: "20px",
            letterSpacing: "-0.04em",
            color: color ?? "#525252",
          }}>
          Coming soon
        </p>
      ) : customPricing ? (
        <div sx={{ display: "flex", alignItems: "center" }}>
          <CheckIcon />
          <p
            sx={{
              ml: "8px",
              fontSize: "16px",
              letterSpacing: "-0.04em",
              color: color ?? "black",
            }}>
            Custom pricing available
          </p>
        </div>
      ) : null}
    </div>
  );
};

const PricingCard = ({
  pricingTitle,
  titleColor,
  cardBg,
  pricingDescription,
  btn,
  children,
  className,
}: PricingCard) => {
  return (
    <div
      className={className}
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        px: "25px",
        paddingTop: "25px",
        borderRadius: "16px",
        background: cardBg,
        maxWidth: "280px",
      }}>
      <div sx={{ display: "flex", flexDirection: "column" }}>
        <h1
          sx={{
            fontSize: "32px",
            lineHeight: "40px",
            mb: "4px",
            fontWeight: "600",
            letterSpacing: "-0.04em",
            color: titleColor ?? "white",
          }}>
          {pricingTitle}
        </h1>
        <p
          sx={{
            fontSize: "16px",
            mb: "16px",
            lineHeight: "16px",
            color: titleColor ?? "white",
          }}>
          {pricingDescription}
        </p>
        <button disabled={btn.disabled} onClick={btn.onClick}>
          <a
            sx={{
              width: "100%",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              background: btn.bg ?? "white",
              color: btn.color ?? "black",
              fontSize: "14px",
              letterSpacing: "-0.03em",
              fontWeight: "600",
              transition: "all 0.3s",
              cursor: btn.disabled ? 'not-allowed' : 'pointer',
              ":hover": {
                opacity: btn.disabled ? '' : "0.9",
              },
            }}>
            {btn.display}
          </a>
        </button>
      </div>
      <div sx={{ display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
};

export default PricingCard;
