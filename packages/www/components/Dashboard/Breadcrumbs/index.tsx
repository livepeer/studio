import { styled, Box } from "@livepeer.com/design-system";
import { Children, isValidElement } from "react";

const BreadcrumbsOl = styled("ol", {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  padding: 0,
  margin: 0,
  listStyle: "none",
  fontSize: "$3",
});

const BreadcrumbsSeparator = styled("li", {
  display: "flex",
  userSelect: "none",
  marginLeft: 8,
  marginRight: 8,
  color: "$gray8",
  mb: 0,
});

function insertSeparators(items) {
  return items.reduce((acc, current, index) => {
    if (index < items.length - 1) {
      acc = acc.concat(
        current,
        <BreadcrumbsSeparator aria-hidden key={`separator-${index}`}>
          /
        </BreadcrumbsSeparator>
      );
    } else {
      acc.push(current);
    }

    return acc;
  }, []);
}

const Breadcrumbs = ({ children }) => {
  const allItems = Children.toArray(children)
    .filter((child) => {
      return isValidElement(child);
    })
    .map((child, index) => (
      <Box
        as="li"
        css={{
          m: 0,
          fontSize: "$3",
        }}
        key={`child-${index}`}>
        <Box css={{ display: "inline-flex" }}>{child}</Box>
      </Box>
    ));
  return (
    <Box>
      <BreadcrumbsOl>{insertSeparators(allItems)}</BreadcrumbsOl>
    </Box>
  );
};

export default Breadcrumbs;
