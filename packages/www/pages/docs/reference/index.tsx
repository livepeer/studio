import React, { useEffect } from "react";
import { Box } from "@theme-ui/components";
import toc from "markdown-toc-unlazy";
import reference from "../../../reference-api.md";
import markdownIt from "markdown-it";
import markdownItAnchor from "../../../lib/markdown-it-anchor";
import uslug from "uslug";
import { buildTree } from "../../../lib/utils";
import DocsLayout from "../../../components/DocsLayout";

const md = markdownIt();
const uslugify = (s) => uslug(s);
const markdownItAnchorOptions = {
  level: 3,
  permalink: true,
  permalinkClass: "header-anchor",
  permalinkSymbol: "#",
  permalinkBefore: true,
  slugify: uslugify,
};

md.use(markdownItAnchor, markdownItAnchorOptions);

let json = toc(reference).json.filter(
  (obj) =>
    obj.content !== "Description" &&
    obj.content !== "Responses" &&
    obj.content !== "Parameters"
);
json = json.map((obj) => {
  obj.slug = `#${obj.slug}`;
  return obj;
});
const tree = buildTree(json);

const ReferencePage = () => {
  // hide non-public facing methods from docs (hack)
  // TODO: remove non-public facing methods from openapi spec
  useEffect(() => {
    function hideElements(id1, id2) {
      var start: any = document.querySelector(id1);
      var next: any = nextUntil(start, id2);
      Array.prototype.forEach.call(next, function (node) {
        node.parentNode.removeChild(node);
      });
      start.style.display = "none";
    }
    hideElements("#user-verification", "#api-token");
    hideElements("#user-verification-1", "#api-token");
  }, []);

  return (
    <DocsLayout tree={tree}>
      <Box
        sx={{
          ".header-anchor": {
            ml: "-16px",
            pr: 1,
            visibility: "hidden",
          },
          "h3:hover .header-anchor, h4:hover .header-anchor, h5:hover .header-anchor, h6:hover .header-anchor": {
            visibility: "visible",
          },
          h1: { mt: 0 },
        }}
        dangerouslySetInnerHTML={{ __html: md.render(reference) }}
      />
    </DocsLayout>
  );
};

export default ReferencePage;

function nextUntil(elem, selector, filter = null) {
  // Setup siblings array
  var siblings = [];

  // Get the next sibling element
  elem = elem.nextElementSibling;

  // As long as a sibling exists
  while (elem) {
    // If we've reached our match, bail
    if (elem.matches(selector)) break;

    // If filtering by a selector, check if the sibling matches
    if (filter && !elem.matches(filter)) {
      elem = elem.nextElementSibling;
      continue;
    }

    // Otherwise, push it to the siblings array
    siblings.push(elem);

    // Get the next sibling element
    elem = elem.nextElementSibling;
  }

  return siblings;
}
