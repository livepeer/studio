import { Box, Flex, Link } from "@livepeer/design-system";
import { DownloadIcon } from "@radix-ui/react-icons";
import {
  CellComponentProps,
  TableData,
} from "components/Dashboard/Table/types";
import { truncate } from "../../../lib/utils";

function makeMP4Url(url: string, profileName: string): string {
  if (url.endsWith(".mp4")) {
    return url;
  }
  const pp = url.split("/");
  pp.pop();
  return pp.join("/") + "/" + profileName + ".mp4";
}

type Profile = { name: string; width: number; height: number };
export type RecordingUrlCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  mp4Url?: string;
  id?: string;
  profiles?: Array<Profile>;
  showMP4: boolean;
};

const RecordingUrlCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, RecordingUrlCellProps>) => {
  const id = cell.value.id;
  return (
    <Box id={`mp4-link-dropdown-${id}`} css={{ position: "relative" }}>
      {cell.value.mp4Url ? (
        <Flex css={{ ai: "center", justifyContent: "space-between" }}>
          {cell.value.children}
          {cell.value.showMP4 && cell.value.profiles?.length ? (
            <Link
              target="_blank"
              href={makeMP4Url(cell.value.mp4Url, "source")}>
              <DownloadIcon />
            </Link>
          ) : null}
        </Flex>
      ) : (
        truncate(cell.value.children, 20)
      )}
    </Box>
  );
};

export default RecordingUrlCell;
