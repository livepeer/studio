import {
  Box,
  Flex,
  TextField,
  Heading,
  Label,
  Link,
  Tooltip,
  Checkbox,
  styled,
} from "@livepeer/design-system";
import { Button } from "components/ui/button";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "../../hooks";
import Spinner from "components/Spinner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "components/ui/dialog";
import { Text } from "components/ui/text";
import { ApiToken } from "@livepeer.studio/api";
import {
  ExclamationTriangleIcon as Warning,
  QuestionMarkCircledIcon as Help,
  Cross1Icon as Cross,
  PlusIcon as Plus,
} from "@radix-ui/react-icons";
import ClipButton from "../Clipping/ClipButton";
import { Input } from "components/ui/input";

const initialCorsOpts: ApiToken["access"]["cors"] = {
  allowedOrigins: ["http://localhost:3000"],
};

const StyledCross = styled(Cross, {});

const CreateDialog = ({
  isOpen,
  onOpenChange,
  onCreateSuccess,
  onClose,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateSuccess: undefined | (() => void);
  onClose: () => void;
}) => {
  const [creating, setCreating] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [allowCors, setAllowCors] = useState(false);
  const [cors, setCors] = useState(initialCorsOpts);
  const [newAllowedOrigin, setNewAllowedOrigin] = useState("");
  const { createApiToken, user } = useApi();
  const [isCopied, setCopied] = useState(0);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);

  const isAdmin = useMemo(() => user?.admin === true, [user]);
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
        let allowedOrigins = cors.allowedOrigins?.includes(origin)
          ? cors.allowedOrigins.filter((item) => item !== origin)
          : [...cors.allowedOrigins, origin];
        if (allowedOrigins.includes("*")) {
          allowedOrigins = ["*"];
        }
        return {
          ...cors,
          allowedOrigins,
        };
      });
    },
    [setCors],
  );

  const isNewOriginValid = useMemo(() => {
    if (newAllowedOrigin === "*") {
      return true;
    }
    try {
      const url = new URL(newAllowedOrigin);
      return url.origin === newAllowedOrigin;
    } catch (err) {
      return false;
    }
  }, [newAllowedOrigin]);

  const onSubmitNewOrigin = useCallback(() => {
    if (!isNewOriginValid) {
      return;
    }
    setNewAllowedOrigin((value) => {
      if (value !== "") {
        toggleOrigin(value);
      }
      return "";
    });
  }, [toggleOrigin, setNewAllowedOrigin, isNewOriginValid]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        {!newToken && (
          <>
            <DialogTitle>
              <Heading size="1">Create an API Key</Heading>
            </DialogTitle>
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
              <DialogDescription asChild>
                <Text className="my-2" variant="neutral">
                  Enter a name for your key to differentiate it from other keys.
                </Text>
              </DialogDescription>

              <Flex direction="column" gap="2">
                <Input
                  type="text"
                  required
                  id="tokenName"
                  autoFocus={true}
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. New key"
                />

                <Box css={{ display: "flex", mt: "$2", alignItems: "center" }}>
                  <Checkbox
                    placeholder="allowCors"
                    id="allowCors"
                    checked={allowCors}
                    disabled={isAdmin}
                    onCheckedChange={(checked: boolean) =>
                      setAllowCors(checked)
                    }
                  />
                  <Tooltip
                    content={
                      isAdmin
                        ? "CORS API keys are not available to admins."
                        : "This will allow the API key to be used directly from the browser. It is recommended only for development purposes since including your API key in web pages will expose it to the world."
                    }
                    multiline>
                    <Flex
                      direction="row"
                      css={{ ml: "$2" }}
                      gap="1"
                      align="center">
                      <Label htmlFor="allowCors">Allow CORS access</Label>
                      <Link
                        href="https://docs.livepeer.org/guides/developing/quickstart.en-US#create-an-api-key-in-livepeer-studio"
                        target="_blank">
                        <Warning />
                      </Link>
                    </Flex>
                  </Tooltip>
                </Box>

                {allowCors && (
                  <>
                    <Label htmlFor="addAllowedOrigin" css={{ mt: "$1" }}>
                      Add an origin
                    </Label>
                    <Box css={{ display: "flex", alignItems: "stretch" }}>
                      <Input
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
                        className="ml-1"
                        variant="outline"
                        disabled={!isNewOriginValid}
                        onClick={(e) => {
                          e.preventDefault();
                          onSubmitNewOrigin();
                        }}>
                        <Plus />
                      </Button>
                    </Box>

                    {newAllowedOrigin !== "" && !isNewOriginValid ? (
                      <Text variant="error">Invalid origin</Text>
                    ) : null}

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
                        backgroundColor: "hsl(var(--card))",
                        mt: "-3px",
                        zIndex: 1,
                      }}>
                      {cors.allowedOrigins.length > 0 ? (
                        cors.allowedOrigins.map((origin, i) => (
                          <Flex
                            key={origin}
                            justify="between"
                            align="center"
                            css={{
                              width: "100%",
                              p: "$2",
                              fontSize: "$2",
                              color: "$hiContrast",
                            }}>
                            {origin}
                            <StyledCross
                              className="h-3 w-3"
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
                          <Text variant="neutral">
                            Add origins with the input field above.
                          </Text>
                        </Flex>
                      )}
                    </Flex>

                    <Box css={{ display: "flex", mt: "$2" }}>
                      <Checkbox
                        placeholder="corsFullAccess"
                        id="corsFullAccess"
                        checked={cors.fullAccess ?? false}
                        onCheckedChange={(checked: boolean) =>
                          setCors({
                            ...cors,
                            fullAccess: checked,
                          })
                        }
                      />
                      <Tooltip
                        content="This will give access to the entire API for the CORS-enabled API key. Resources in your account will be fully exposed to anyone that grabs the API key from your web page. Only check this if you know what you are doing."
                        multiline>
                        <Flex
                          direction="row"
                          css={{ ml: "$2" }}
                          gap="1"
                          align="center">
                          <Label htmlFor="corsFullAccess">
                            Full API access (not recommended)
                          </Label>
                          <Link
                            href={
                              "/docs/guides/start-live-streaming/api-key#api-access"
                            }
                            target="_blank">
                            <Help />
                          </Link>
                        </Flex>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Flex>

              <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={creating} type="submit">
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
            <DialogTitle>
              <Heading size="1">Token Created</Heading>
            </DialogTitle>
            <DialogDescription asChild>
              <Text className="my-2" variant="neutral">
                <Box>
                  <Box css={{ mb: "$2" }}>Here's your new API key:</Box>
                  <Button variant="outline">
                    <ClipButton value={newToken.id} text={newToken.id} />
                  </Button>
                </Box>
              </Text>
            </DialogDescription>
            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <Button onClick={() => onClose()} variant="outline">
                Close
              </Button>
            </Flex>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateDialog;
