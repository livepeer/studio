/** @jsx jsx */

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const DocsCardsContainer = ({ children }: Props) => {
  return (
    <div
      sx={{
        width: "100%",
        alignSelf: "center",
        display: "grid",
        gridTemplateColumns: ["1fr", "1fr 1fr"],
        gap: ["24px", "8px"],
      }}>
      {children}
    </div>
  );
};

export default DocsCardsContainer;
