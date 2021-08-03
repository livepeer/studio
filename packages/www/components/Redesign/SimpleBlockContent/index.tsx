import BlockContent from "@sanity/block-content-to-react";
import Serializers from "components/Redesign/Serializers";
import { Box } from "@livepeer.com/design-system";

const SimpleBlockContent = (props) => {
  const { blocks } = props;

  if (!blocks) {
    console.error("Missing blocks");
    return null;
  }

  return (
    <Box
      css={{
        "p, div, ul, li": {
          lineHeight: 1.8,
          color: "$gray11",
        },
        "h1, h2, h3, h4, h5, h6": {
          color: "$hiContrast",
          lineHeight: 1.5,
        },
        strong: {
          color: "$hiContrast",
        },
        em: {
          color: "$hiContrast",
        },
        figure: {
          m: 0,
        },
        img: {
          width: "100%",
        },
        a: {
          color: "$violet9",
        },
      }}>
      <BlockContent blocks={blocks} serializers={Serializers} />
    </Box>
  );
};

export default SimpleBlockContent;
