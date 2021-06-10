import slugify from "@sindresorhus/slugify";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { BsArrowRightShort } from "react-icons/bs";

import s from "./styles.module.scss";

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

type HeadingProps = {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: ReactNode;
};

const SimpleCard = ({ title, description, href, label }: SimpleCardProps) => {
  return (
    <Link href={href} passHref>
      <a className={s.simpleCard}>
        <div className={s.simpleCardContent}>
          <span className={s.simpleCardContentTitle}>{title}</span>
          <span className={s.simpleCardContentDescription}>{description}</span>
        </div>
        <div className={s.simpleCardLink}>
          <span className={s.simpleCardLinkLabel}>{label ?? "Read guide"}</span>
          <BsArrowRightShort color="white" size={24} />
        </div>
      </a>
    </Link>
  );
};

const NavigationCard = ({ title, href, label }: CardProps) => {
  return (
    <Link href={href} passHref>
      <a className={s.navigationCard}>
        <p className={s.navigationCardLinkTitle}>{title}</p>
        <div className={s.navigationCardLinkContainer}>
          <span className={s.navigationCardLinkLabel}>
            {label ?? "Read guide"}
          </span>
          <BsArrowRightShort color="#943CFF" size={22} />
        </div>
      </a>
    </Link>
  );
};

const DocsPost = ({ description, title, image, href }: PostProps) => {
  return (
    <Link href={href} passHref>
      <a className={s.docsPost}>
        <div className={s.imageContainer}>
          <Image
            src={image}
            layout="responsive"
            objectFit="cover"
            width={372}
            height={272}
          />
        </div>
        <span className={s.docsPostTitle}>{title}</span>
        <span className={s.docsPostDescription}>{description}</span>
      </a>
    </Link>
  );
};

const DocsGrid = ({ children, cols }: GridProps) => {
  return (
    <div className={s.docsGrid} style={{ ["--cols" as string]: cols }}>
      {children}
    </div>
  );
};

const Heading = ({ children, as }: HeadingProps) => {
  const id = slugify(children.toString());
  const Comp = as;

  return (
    <Comp className={s.heading} id={id}>
      <a aria-label="Anchor" href={`#${id}`} className="no-index">
        #
      </a>
      <span>{children}</span>
    </Comp>
  );
};

export { SimpleCard, NavigationCard, DocsPost, DocsGrid, Heading };
