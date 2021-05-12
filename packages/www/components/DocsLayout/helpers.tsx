import { Grid } from "@theme-ui/components";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { BsArrowRightShort } from "react-icons/bs";

type CardProps = {
  title: string;
  href: string;
  label?: string;
};

type SimpleCardProps = {
  description: string;
  title: string;
  href: string;
  label?: string;
};

type PostProps = {
  title: string;
  description: string;
  image: string;
  href: string;
};

type GridProps = {
  children: ReactNode;
  cols: number | string;
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
              fontSize: "16px",
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
        maxWidth: '240px',
        padding: "24px",
        border: "1px solid #E6E6E6",
        minHeight: "152px",
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px",
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
              fontSize: "14px",
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

const DocsPost = ({ description, title, image, href }: PostProps) => {
  return (
    <Link href={href}>
      <a sx={{ display: "flex", flexDirection: "column", width: "100%", cursor: 'pointer' }}>
        <Image
          src={image}
          layout="responsive"
          objectFit="cover"
          width={372}
          height={272}
          sx={{
            borderRadius: "16px",
            transition: "all 0.2s",
            ":hover": {
              boxShadow:
                "0px 2px 2px rgba(0, 0, 0, 0.2), 0px 0px 8px rgba(0, 0, 0, 0.03), 0px 30px 30px rgba(0, 0, 0, 0.02)",
            },
          }}
        />
        <p
          sx={{
            margin: "24px 0 8px",
            fontSize: "24px",
            lineHeight: "32px",
            fontWeight: "600",
            letterSpacing: "-0.04em",
          }}>
          {title}
        </p>
        <p
          sx={{
            fontSize: "16px",
            lineHeight: "28px",
            letterSpacing: "-0.02em",
          }}>
          {description}
        </p>
      </a>
    </Link>
  );
};

const DocsGrid = ({ children, cols }: GridProps) => {
  return (
    <Grid
      sx={{
        gap: "24px",
        justifyItems: 'center',
        gridTemplateColumns: ["1fr", "1fr 1fr", `repeat(${cols}, 1fr)`],
      }}>
      {children}
    </Grid>
  );
};

export { SimpleCard, NavigationCard, DocsPost, DocsGrid };
