import Layout from "../../../../layouts/dashboard";
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  styled,
} from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import { useCallback } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import WebhookDialog, { Action } from "@components/Dashboard/WebhookDialog";
import { useToggleState } from "hooks/use-toggle-state";
import { Pencil1Icon, Cross1Icon } from "@radix-ui/react-icons";

const Cell = styled(Text, {
  py: "$2",
  fontSize: "$3",
});

const StyledPencil = styled(Pencil1Icon, {
  mr: "$1",
  width: 12,
  height: 12,
});

const StyledCross = styled(Cross1Icon, {
  mr: "$1",
  width: 12,
  height: 12,
});

const ApiKeys = () => {
  useLoggedIn();
  const { user, getWebhook, updateWebhook } = useApi();
  const router = useRouter();
  const dialogState = useToggleState();
  const { id } = router.query;

  const fetcher = useCallback(async () => {
    const webhook = await getWebhook(id);
    return webhook;
  }, [id]);

  const { data, revalidate } = useSWR([id], () => fetcher());
  console.log(data);
  return !user || user.emailValid === false ? null : (
    <Layout
      id="developers/webhooks"
      breadcrumbs={[
        { title: "Developers" },
        { title: "Webhooks", href: "/dashboard/developers/webhooks" },
        { title: data?.name },
      ]}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          {data && (
            <Box
              css={{
                borderRadius: 6,
                border: "1px solid $colors$mauve7",
              }}>
              <Flex
                css={{
                  p: "$3",
                  width: "100%",
                  borderBottom: "1px solid $colors$mauve7",
                  ai: "center",
                  jc: "space-between",
                }}>
                <Heading size="2" css={{}}>
                  {data.url}
                </Heading>
                <Flex css={{ ai: "center" }}>
                  <Button
                    size="2"
                    css={{ mr: "$2", display: "flex", ai: "center" }}
                    variant="red">
                    <StyledCross />
                    Delete
                  </Button>
                  <WebhookDialog
                    button={
                      <Button
                        size="2"
                        css={{ display: "flex", ai: "center" }}
                        onClick={() => dialogState.onToggle()}>
                        <StyledPencil />
                        Update details
                      </Button>
                    }
                    webhook={data}
                    action={Action.Update}
                    isOpen={dialogState.on}
                    onOpenChange={dialogState.onToggle}
                    onSubmit={async ({ event, name, url }) => {
                      await updateWebhook(data.id, {
                        ...data,
                        event: event ? event : data.event,
                        name: name ? name : data.name,
                        url: url ? url : data.url,
                      });
                      await revalidate();
                    }}
                  />
                </Flex>
              </Flex>

              <Box
                css={{
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: "12em auto",
                  width: "100%",
                  fontSize: "$2",
                  position: "relative",
                  p: "$3",
                  borderBottomLeftRadius: 6,
                  borderBottomRightRadius: 6,
                  backgroundColor: "$panel",
                }}>
                <Cell variant="gray">URL</Cell>
                <Cell>{data.url}</Cell>
                <Cell variant="gray">Name</Cell>
                <Cell>{data.name}</Cell>
                <Cell variant="gray">Created</Cell>
                <Cell>{data.createdAt}</Cell>
                <Cell variant="gray">Event types</Cell>
                <Cell css={{ fontFamily: "monospace" }}>{data.event}</Cell>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default ApiKeys;
