/** @jsx jsx */
import { jsx } from "theme-ui";
import Link from "next/link";
import { ReactNode } from "react";
import { Box } from "@theme-ui/components";

export type PricingCard = {
  pricingTitle: string;
  titleColor?: string;
  cardBg: string;
  pricingDescription: string;
  btn: { href: string; display: string; bg?: string; color?: string };
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
        stroke="#6e56cf"
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
    <Box
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
        <Box
          as="p"
          sx={{
            fontSize: "20px",
            letterSpacing: "-0.04em",
            color: color ?? "#525252",
          }}>
          Coming soon
        </Box>
      ) : customPricing ? (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CheckIcon />
          <Box
            as="p"
            sx={{
              ml: "8px",
              fontSize: "16px",
              letterSpacing: "-0.04em",
              color: color ?? "black",
            }}>
            Custom pricing available
          </Box>
        </Box>
      ) : null}
    </Box>
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
    <Box
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
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box
          as="h1"
          sx={{
            fontSize: "32px",
            lineHeight: "40px",
            mb: "4px",
            fontWeight: "600",
            letterSpacing: "-0.04em",
            color: titleColor ?? "white",
          }}>
          {pricingTitle}
        </Box>
        <Box
          as="p"
          sx={{
            fontSize: "16px",
            mb: "16px",
            lineHeight: "16px",
            color: titleColor ?? "white",
          }}>
          {pricingDescription}
        </Box>
        <Link href={btn.href} passHref>
          <Box
            as="a"
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
              ":hover": {
                opacity: "0.9",
              },
            }}>
            {btn.display}
          </Box>
        </Link>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>{children}</Box>
    </Box>
  );
};

export default PricingCard;
