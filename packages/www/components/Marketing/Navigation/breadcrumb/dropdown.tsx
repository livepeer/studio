import { useEffect } from "react";
import { Box } from "@livepeer.com/design-system";

type Props = {
  children: React.ReactNode;
  isOpen: boolean;
  close: () => any;
  id?: string;
  css?: any;
};

const BreadcrumbDropdown = ({ children, isOpen, close, id, css }: Props) => {
  function handleClick(e: any) {
    const isInside = e?.target?.closest(`#dropdown-${id}`) !== null;
    if (isInside) return;
    close();
    document.removeEventListener("click", handleClick);
  }

  useEffect(() => {
    if (isOpen) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <Box
      id={`dropdown-${id}`}
      css={{
        position: "absolute",
        right: "-15px",
        top: "32px",
        width: "max-content",
        backgroundColor: "$panel",
        boxShadow:
          "0px 24px 40px rgba(0, 0, 0, 0.24), 0px 30px 30px rgba(0, 0, 0, 0.02)",
        borderRadius: 8,
        p: "$3",
        border: "1px solid $colors$mauve5",
      }}>
      <Box css={{ position: "absolute", right: "15px", top: "-8px", ...css }}>
        <svg
          width="20"
          height="10"
          viewBox="0 0 20 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17.2839 7.5H18.5C19.0523 7.5 19.5 7.94772 19.5 8.5C19.5 9.05229 19.0523 9.5 18.5 9.5H1.5C0.947715 9.5 0.5 9.05229 0.5 8.5C0.5 7.94772 0.947715 7.5 1.5 7.5H2.76293C3.69243 7.5 4.57781 7.10358 5.19688 6.41023L9.06779 2.07481C9.68073 1.38832 10.7616 1.41058 11.3458 2.12172L14.7987 6.32528C15.4096 7.06898 16.3215 7.5 17.2839 7.5Z"
            fill="white"
            stroke="#EAEAEA"
          />
          <rect y="8" width="20" height="2" fill="white" />
        </svg>
      </Box>
      {children}
    </Box>
  );
};

export default BreadcrumbDropdown;
