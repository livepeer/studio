import moment from "moment";
import { Box } from "@theme-ui/components";
import ReactTooltip from "react-tooltip";

type RelativeTimeProps = {
  id: string;
  prefix: string;
  tm: number;
  swap?: boolean;
};

const RelativeTime = ({ id, prefix, tm, swap = false }: RelativeTimeProps) => {
  const idpref = `time-${prefix}-${id}`;
  let main = moment.unix(tm / 1000.0).fromNow();
  let toolTip = moment.unix(tm / 1000.0).format("LLL");
  if (swap) {
    const s = main;
    main = toolTip;
    toolTip = s;
  }
  return (
    <Box id={idpref} key={idpref}>
      {tm ? (
        <>
          <ReactTooltip
            id={`tooltip-${idpref}`}
            className="tooltip"
            place="top"
            type="dark"
            effect="solid">
            {toolTip}
          </ReactTooltip>
          <Box as="span" data-tip data-for={`tooltip-${idpref}`}>
            {main}
          </Box>
        </>
      ) : (
        <Box css={{ fontStyle: "italic" }}>unseen</Box>
      )}
    </Box>
  );
};

export default RelativeTime;
