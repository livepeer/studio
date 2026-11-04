import Layout from "layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import { DashboardSessions as Content } from "content";
import ModelGallery from "components/ModelGallery";
import { Text } from "components/ui/text";
import { Badge } from "components/ui/badge";

export default function ModelGalleryPage() {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="model-gallery"
      breadcrumbs={[{ title: "Model Gallery" }]}
      {...Content.metaData}>
      <Box
        css={{
          pb: "$9",
          px: "$6",
          pt: "$6",
          "@bp4": {
            p: "$6",
          },
        }}>
        <Box css={{ mb: "$5" }}>
          <Box
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
              pb: "$5",
              mb: "$5",
              width: "100%",
            }}>
            <Text size="xl" weight="semibold">
              AI Model Gallery <Badge>Experimental</Badge>
            </Text>
            <Text variant="neutral" className="mt-2" size="sm">
              Explore all available model APIs provided by Livepeer Network.
            </Text>
          </Box>
        </Box>
        <ModelGallery />
      </Box>
    </Layout>
  );
}
