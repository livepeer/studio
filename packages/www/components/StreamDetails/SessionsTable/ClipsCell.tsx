import { CellComponentProps, TableData } from "components/Table/types";
import { Box, Link, Badge } from "@livepeer/design-system";
import { ArrowRightIcon, ArrowTopRightIcon } from "@radix-ui/react-icons";
import useProject from "hooks/use-project";

function makeMP4Url(url: string, profileName: string): string {
  if (url.endsWith(".mp4")) {
    return url;
  }
  const pp = url.split("/");
  pp.pop();
  return pp.join("/") + "/" + profileName + ".mp4";
}

type Profile = { name: string; width: number; height: number };

export type ClipsCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  sessionId?: string;
  clipsCounts?: number;
  id?: string;
  showClipIcon?: boolean;
};

const ClipsCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, ClipsCellProps>) => {
  const id = cell.value.id;
  const { appendProjectId } = useProject();

  return (
    <Box id={`mp4-link-dropdown-${id}`} css={{ position: "relative" }}>
      {cell.value.clipsCounts > 0 ? (
        <Box css={{ pr: "$1" }}>
          <Link
            href={appendProjectId(
              "/assets?sourceSessionId=" + cell.value.sessionId
            )}>
            <Badge size="1" variant="neutral" css={{}}>
              {cell.value.clipsCounts}
            </Badge>
          </Link>
        </Box>
      ) : (
        <Box css={{ pr: "$1" }}></Box>
      )}
    </Box>
  );
};

export default ClipsCell;
