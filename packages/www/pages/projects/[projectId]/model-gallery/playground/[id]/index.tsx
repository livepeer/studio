import Layout from "layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import { DashboardSessions as Content } from "content";
import ModelGallery from "components/ModelGallery";
import { Text } from "components/ui/text";
import { Badge } from "components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { useRouter } from "next/router";
import { availableModels } from "components/ModelGallery/constants";
import type { Model as ModelT } from "components/ModelGallery/constants";

export default function PlaygroundPage() {
  useLoggedIn();
  const { user } = useApi();
  const { query } = useRouter();
  const id = query.id as string;

  const model = availableModels.find((model) => model.id === id);

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="model-gallery/playground"
      breadcrumbs={[{ title: "Playground" }]}
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
        <PageHeader model={model} />
        <main className="flex flex-col md:flex-row flex-1 gap-4 overflow-auto mt-4">
          <div className="flex flex-col md:w-1/3">
            <form className="grid w-full items-start gap-6 ">
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Prompt
                </legend>
              </fieldset>
            </form>
          </div>
        </main>
      </Box>
    </Layout>
  );
}

const PageHeader = ({ model }: { model: ModelT }) => {
  return (
    <Card className="rounded-md py-2">
      <CardHeader className="pb-4 pl-8 space-y-2">
        <CardTitle>{model?.title}</CardTitle>
        <CardDescription>
          <div className="flex items-center gap-1">
            <img
              src={"/dashboard/ai/livepeer.webp"}
              className="w-5 h-5 rounded-full "
              alt="Livepeer Network"
            />
            {model?.id}
          </div>
        </CardDescription>
        <div className="mt-6">
          <Badge>{model?.pipline}</Badge>
        </div>
      </CardHeader>
    </Card>
  );
};
