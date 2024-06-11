import { ApiToken } from "@livepeer.studio/api";
import { Tooltip, Label } from "@livepeer/design-system";

const CorsCell = (params: { cors: ApiToken["access"]["cors"] }) => {
  const { cors } = params;
  if (!cors?.allowedOrigins?.length) {
    return (
      <Tooltip
        content="This is the most secure mode for API keys, blocking access from any webpage."
        multiline>
        <Label>None</Label>
      </Tooltip>
    );
  }
  const accessLevel = cors.fullAccess ? "Full" : "Restricted";
  return (
    <Tooltip
      content={
        cors.allowedOrigins.includes("*")
          ? `${accessLevel} access allowed from any origin`
          : `${accessLevel} access allowed from: ${cors.allowedOrigins.join(
              ", ",
            )}`
      }
      multiline>
      <Label>
        <i>{accessLevel}</i>
      </Label>
    </Tooltip>
  );
};

export default CorsCell;
