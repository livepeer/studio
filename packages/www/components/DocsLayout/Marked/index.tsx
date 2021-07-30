import clsx from "clsx";
import marked, { MarkedOptions } from "marked";
import { useMemo } from "react";

type Renderer = Partial<MarkedOptions["renderer"]>;

type Props = {
  children: string;
  className?: string;
  noDefaultStyles?: boolean;
  options?: Omit<MarkedOptions, "renderer"> & { renderer?: Renderer };
  svgForUnderline?: React.ReactElement;
};

const Marked = ({ children, className, noDefaultStyles, options }: Props) => {
  const html = useMemo(() => {
    if (options) {
      // @ts-ignore
      marked.use(options);
    }
    return marked(children);
  }, [children, options]);

  return (
    <div
      className={clsx(className, {})}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Marked;
