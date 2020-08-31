import { pascalCase } from "pascal-case";
import { Element } from "react-scroll";
export const getComponent = (component) => {
  const componentName = pascalCase(component._type);
  try {
    const Component = require(`../components/${componentName}`).default;
    return (
      <Element
        offset={-20}
        key={component._type}
        id={component._type}
        name={component._type}
      >
        <Component {...component} />
      </Element>
    );
  } catch (e) {
    return null;
  }
};

export function pathJoin2(p1: string, p2: string): string {
  if (!p1) {
    return p2;
  }
  if (p1[p1.length - 1] === "/") {
    p1 = p1.slice(0, p1.length - 1);
  }
  if (p2 && p2[0] === "/") {
    p2 = p2.slice(1);
  }
  return p1 + "/" + (p2 || "");
}

export function pathJoin(...items: Array<string>): string {
  return items.reduce(pathJoin2, "");
}

export function breakablePath(path: string): string {
  if (!path) {
    return path;
  }
  return path.split("/").join("/\u{200B}");
}

export function buildTree(toc) {
  // [h1, children]
  const tree = [undefined, []];

  // references to latest
  // [h1, h2, h3, h4, h5] (h6 excluded because cannot have children)
  let references = [null, tree]; // usable indexes are 1,2,3,4,5

  for (const heading of toc) {
    const h = Math.min(6, heading.lvl); // h1-h6

    // h1
    if (h === 1) {
      tree[0] = heading;
      continue;
    }

    // create prior reference for references[h] if they don't exist
    // EXAMPLE: inserting h4 but prior h2 and h3 don't exist
    if (!references[h - 1]) {
      for (let i = 2; i < h; i++) {
        // start from h2

        // h2 doesn't exist, create it from the parent h1
        if (!references[i]) {
          let parentChildren = references[i - 1][1];
          let newReference = [undefined, []];

          parentChildren.push(newReference);
          references[i] = newReference;
        }
      }
    }

    // insert newItem
    let newItem = [heading, []];
    references[h - 1][1].push(newItem); // 1. insert newItem
    references[h] = newItem; // 2. newItem becomes references[h]
    references.splice(h + 1); // 3. remove deeper references
  }

  // Return the tree
  return tree;
}
