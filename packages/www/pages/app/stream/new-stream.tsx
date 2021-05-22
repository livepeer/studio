import { useState } from "react";
import Link from "next/link";
import useApi from "../../../hooks/use-api";
import {
  Flex,
  Button,
  Box,
  Grid,
  Input,
  Container,
  Heading,
} from "@theme-ui/components";
import Layout from "../../../layouts";
import useLoggedIn from "../../../hooks/use-logged-in";
import { useRouter } from "next/router";

const NewStream = () => {
  useLoggedIn();
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const [streamName, setStreamName] = useState("");
  const { user, createStream } = useApi();
  const backLink = router.query.admin ? "/app/admin/streams" : "/app/user";

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  return (
    <Layout>
      <Container
        sx={{
          mb: 5,
          mt: 3,
        }}>
        <Box sx={{ mb: 3 }}>
          <Link href={backLink}>
            <a>{"← stream list"}</a>
          </Link>
        </Box>

        <Heading as="h3" sx={{ mb: 4 }}>
          Create a new stream
        </Heading>
        <form
          id={"New Stream"}
          onSubmit={(e) => {
            e.preventDefault();
            if (creating) {
              return;
            }
            setCreating(true);
            createStream({
              name: streamName,
              profiles: [
                {
                  name: "240p0",
                  fps: 0,
                  bitrate: 250000,
                  width: 426,
                  height: 240,
                },
                {
                  name: "360p0",
                  fps: 0,
                  bitrate: 800000,
                  width: 640,
                  height: 360,
                },
                {
                  name: "480p0",
                  fps: 0,
                  bitrate: 1600000,
                  width: 854,
                  height: 480,
                },
                {
                  name: "720p0",
                  fps: 0,
                  bitrate: 3000000,
                  width: 1280,
                  height: 720,
                },
              ],
            })
              .then((newStream) => {
                setCreating(false);
                const query =
                  router.query.admin === "true" ? { admin: true } : {};
                router.replace({
                  pathname: `/app/stream/${newStream.id}`,
                  query,
                });
              })
              .catch((e) => {
                setCreating(false);
              });
          }}>
          <Box sx={{ mb: 2, fontWeight: "500" }}>Stream name</Box>
          <Input
            sx={{ mb: 2 }}
            autoFocus={true}
            label="Stream name"
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            placeholder="new-stream-name-123"
          />
          <Box sx={{ fontSize: 1, color: "offBlack" }}>
            (a-z, A-Z, 0-9, -, _, ~ only)
          </Box>

          <Flex sx={{ justifyContent: "flex-beginning", mt: 4 }}>
            <Button type="submit" variant="outline">
              Save
            </Button>
          </Flex>
        </form>
      </Container>
    </Layout>
  );
};

export default NewStream;
