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

export function getAspectRatio(height: number, width: number, forCss = false) {
  const percentage = (height / width) * 100;
  return forCss ? percentage + "%" : percentage;
}
