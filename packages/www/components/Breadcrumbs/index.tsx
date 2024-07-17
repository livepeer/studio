import { styled, Box } from "@livepeer/design-system";
import { useApi } from "hooks";
import { useProjectContext } from "context/ProjectContext";
import { usePathname } from "next/navigation";
import { Children, isValidElement } from "react";
import { useQuery } from "react-query";

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
  const { projectId } = useProjectContext();
  const { getProjects } = useApi();
  const { data } = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  const pathname = usePathname();

  const isSettingsPage = pathname?.includes("settings/");

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
          lineHeight: 1.5,
        }}
        key={`child-${index}`}>
        <Box css={{ display: "inline-flex" }}>{child}</Box>
      </Box>
    ));

  if (!isSettingsPage) {
    if (projectId) {
      const project = data?.find((project) => project.id === projectId);
      allItems.unshift(
        <Box
          as="li"
          css={{
            m: 0,
            fontSize: "$3",
            lineHeight: 1.5,
          }}
          key="project">
          <Box css={{ display: "inline-flex" }}>{project?.name}</Box>
        </Box>
      );
    }
  }

  return (
    <Box>
      <BreadcrumbsOl>{insertSeparators(allItems)}</BreadcrumbsOl>
    </Box>
  );
};

export default Breadcrumbs;
