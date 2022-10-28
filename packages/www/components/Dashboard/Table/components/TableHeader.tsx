import { Heading } from "@livepeer/design-system";

const TableHeader = ({ title }: { title: string }) => (
  <Heading size="2" css={{ fontWeight: 600 }}>
    {title}
  </Heading>
);

export default TableHeader;
