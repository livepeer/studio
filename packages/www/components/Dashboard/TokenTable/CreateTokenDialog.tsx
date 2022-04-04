import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  TextField,
  Text,
  Heading,
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
  useSnackbar,
  Label,
  Tooltip,
  Checkbox,
  styled,
} from "@livepeer.com/design-system";
import { useState, useEffect, useCallback } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ApiToken } from "../../../../api/src/schema/types";
import {
  CopyIcon as Copy,
  ExclamationTriangleIcon as Warning,
  Cross1Icon as Cross,
  PlusIcon as Plus,
} from "@radix-ui/react-icons";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateSuccess: undefined | (() => void);
  onClose: () => void;
};

const ClipBut = ({ text }) => {
  const [isCopied, setCopied] = useState(0);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  return (
    <HoverCardRoot openDelay={200}>
      <HoverCardTrigger>
        <Flex css={{ height: 25, ai: "center" }}>
          <CopyToClipboard
            text={text}
            onCopy={() => {
              openSnackbar("Copied to clipboard");
              setCopied(2000);
            }}>
            <Flex
              css={{
                alignItems: "center",
                cursor: "pointer",
                ml: 0,
                mr: 0,
              }}>
              <Box css={{ mr: "$1" }}>{text}</Box>
              <Copy
                css={{
                  mr: "$2",
                  width: 14,
                  height: 14,
                  color: "$hiContrast",
                }}
              />
            </Flex>
          </CopyToClipboard>
        </Flex>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text
          variant="gray"
          css={{
            backgroundColor: "$panel",
            borderRadius: 6,
            px: "$3",
            py: "$1",
            fontSize: "$1",
            display: "flex",
            ai: "center",
          }}>
          <Box>{isCopied ? "Copied" : "Copy to Clipboard"}</Box>
        </Text>
      </HoverCardContent>
    </HoverCardRoot>
  );
};

const initialCorsOpts: ApiToken["access"]["cors"] = {
  allowedOrigins: ["http://localhost:3000"],
};

const StyledCross = styled(Cross, {
  cursor: "pointer",
});

const CreateTokenDialog = ({
  isOpen,
  onOpenChange,
  onCreateSuccess,
  onClose,
}: Props) => {
  const [creating, setCreating] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [allowCors, setAllowCors] = useState(false);
  const [cors, setCors] = useState(initialCorsOpts);
  const [newAllowedOrigin, setNewAllowedOrigin] = useState("");
  const { createApiToken } = useApi();
  const [isCopied, setCopied] = useState(0);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);

  useEffect(() => {
    setNewToken(null);
    setTokenName("");
    setAllowCors(false);
    setCors(initialCorsOpts);
    setNewAllowedOrigin("");
  }, [isOpen]);

  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);

  const toggleOrigin = useCallback(
    (origin) => {
      setCors((cors) => {
        const allowedOrigins = cors.allowedOrigins?.includes(origin)
          ? cors.allowedOrigins.filter((item) => item !== origin)
          : [...cors.allowedOrigins, origin];
        return {
          ...cors,
          allowedOrigins,
        };
      });
    },
    [setCors]
  );

  const onSubmitNewOrigin = useCallback(() => {
    setNewAllowedOrigin((value) => {
      if (value !== "") {
        toggleOrigin(value);
      }
      return "";
    });
  }, [toggleOrigin, setNewAllowedOrigin]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        {!newToken && (
          <>
            <AlertDialogTitle as={Heading} size="1">
              Create key
            </AlertDialogTitle>
            <Box
              as="form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (creating) {
                  return;
                }
                setCreating(true);
                try {
                  const _newToken = await createApiToken({
                    name: tokenName,
                    access: allowCors ? { cors } : undefined,
                  });
                  setNewToken(_newToken);
                  onCreateSuccess?.();
                } finally {
                  setCreating(false);
                }
              }}>
              <AlertDialogDescription
                as={Text}
                size="3"
                variant="gray"
                css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                Enter a name for your key to differentiate it from other keys.
              </AlertDialogDescription>

              <Flex direction="column" gap="2">
                <TextField
                  size="2"
                  type="text"
                  required
                  id="tokenName"
                  autoFocus={true}
                  value={tokenName}
                  onChange={(e) =>
                    setTokenName(e.target.value.replace(/\s/g, ""))
                  }
                  placeholder="e.g. New key"
                />

                <Box css={{ display: "flex", mt: "$2" }}>
                  <Checkbox
                    id="allowCors"
                    checked={allowCors}
                    onCheckedChange={(e) => setAllowCors(e.target.checked)}
                  />
                  <Tooltip
                    content="This will allow the API key to be used directly from the browser. It is recommended only for development purposes since including your API key in web pages will expose it to the world."
                    multiline>
                    <Flex
                      direction="row"
                      css={{ ml: "$2" }}
                      gap="1"
                      align="center">
                      <Label htmlFor="allowCors">Allow CORS access</Label>
                      <Warning />
                    </Flex>
                  </Tooltip>
                </Box>

                {allowCors && (
                  <>
                    <Label htmlFor="addAllowedOrigin" css={{ mt: "$1" }}>
                      Add an origin
                    </Label>
                    <Box css={{ display: "flex", alignItems: "stretch" }}>
                      <TextField
                        size="2"
                        type="text"
                        id="addAllowedOrigin"
                        value={newAllowedOrigin}
                        onChange={(e) => setNewAllowedOrigin(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onSubmitNewOrigin();
                          }
                        }}
                        placeholder="e.g. * for all origins; https://example.com for one"
                      />
                      <Button
                        css={{ ml: "$1" }}
                        size="3"
                        variant="violet"
                        onClick={(e) => {
                          e.preventDefault();
                          onSubmitNewOrigin();
                        }}>
                        <Plus />
                      </Button>
                    </Box>

                    <Flex
                      align="center"
                      direction="column"
                      justify={
                        cors.allowedOrigins.length > 0 ? "start" : "center"
                      }
                      css={{
                        width: "100%",
                        borderRadius: 6,
                        height: 120,
                        overflowX: "hidden",
                        overflowY: "auto",
                        border: "1px solid $colors$mauve7",
                        backgroundColor: "$mauve2",
                        mt: "-3px",
                        zIndex: 1,
                      }}>
                      {cors.allowedOrigins.length > 0 ? (
                        cors.allowedOrigins.map((origin, i) => (
                          <Flex
                            key={i}
                            justify="between"
                            align="center"
                            css={{
                              width: "100%",
                              borderBottom: "1px solid $colors$mauve5",
                              p: "$2",
                              fontSize: "$2",
                              color: "$hiContrast",
                            }}>
                            {origin}
                            <StyledCross
                              onClick={() => {
                                toggleOrigin(origin);
                              }}
                            />
                          </Flex>
                        ))
                      ) : (
                        <Flex
                          direction="column"
                          css={{ just: "center" }}
                          align="center">
                          <Text css={{ fontWeight: 600 }}>
                            No origins allowed
                          </Text>
                          <Text variant="gray">
                            Add origins with the input field above.
                          </Text>
                        </Flex>
                      )}
                    </Flex>

                    <Box css={{ display: "flex", mt: "$2" }}>
                      <Checkbox
                        id="corsFullAccess"
                        checked={cors.fullAccess ?? false}
                        onCheckedChange={(e) =>
                          setCors({ ...cors, fullAccess: e.target.checked })
                        }
                      />
                      <Tooltip
                        content="This will give access to the entire API for the CORS-enabled API key. Resources in your account will be fully exposed to anyone that grabs the API key from your web page. Only check this if you know what you are doing."
                        multiline>
                        <Label
                          css={{ pl: "$2", mr: "$1" }}
                          htmlFor="corsFullAccess">
                          Full API access (not recommended)
                        </Label>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Flex>

              <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                <AlertDialogCancel size="2" as={Button} ghost>
                  Cancel
                </AlertDialogCancel>
                <Button
                  size="2"
                  disabled={creating}
                  type="submit"
                  variant="violet">
                  {creating && (
                    <Spinner
                      css={{
                        color: "$hiContrast",
                        width: 16,
                        height: 16,
                        mr: "$2",
                      }}
                    />
                  )}
                  Create
                </Button>
              </Flex>
            </Box>
          </>
        )}
        {newToken && (
          <Box>
            <AlertDialogTitle as={Heading} size="1">
              Token Created
            </AlertDialogTitle>
            <AlertDialogDescription
              as={Text}
              size="3"
              variant="gray"
              css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
              <Box>
                <Box css={{ mb: "$2" }}>Here's your new API key:</Box>

                <Button variant="gray" size="2" css={{ cursor: "pointer" }}>
                  <ClipBut text={newToken.id} />
                </Button>
              </Box>
            </AlertDialogDescription>
            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <Button onClick={() => onClose()} size="2">
                Close
              </Button>
            </Flex>
          </Box>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateTokenDialog;
