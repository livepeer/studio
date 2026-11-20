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
import type {
  Model as ModelT,
  Output as OutputT,
} from "components/ModelGallery/constants";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Switch } from "components/ui/switch";
import { Button } from "components/ui/button";
import { useRef, useState } from "react";
import Output from "./output";
import Form from "./form";
import Link from "next/link";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

export default function PlaygroundPage() {
  useLoggedIn();
  const { user } = useApi();
  const { query } = useRouter();
  const id = query.id as string;
  const [generationTime, setGenerationTime] = useState(0);

  const model = availableModels.find((model) => model.id === id);

  const [output, setOutput] = useState<OutputT[]>([]);
  const [loading, setLoading] = useState(false);

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
        <main className="flex flex-col md:flex-row flex-1 gap-8 overflow-auto mt-4">
          <div className="md:w-[30%]">
            <Form
              model={model}
              setOutput={setOutput}
              setLoading={setLoading}
              loading={loading}
              setGenerationTime={setGenerationTime}
            />
          </div>
          <div className="md:w-[70%]">
            <Output
              model={model}
              output={output}
              loading={loading}
              generationTime={generationTime}
            />
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
          <Link
            href={`https://huggingface.co/${model?.huggingFaceId}`}
            target="_blank"
            className="flex items-center gap-1">
            <img
              src={"https://cdn.worldvectorlogo.com/logos/huggingface-2.svg"}
              className="w-5 h-5 rounded-full "
              alt="Hugging Face Logo"
            />
            {model?.huggingFaceId}
          </Link>
        </CardDescription>
        <div className="mt-6 flex w-full justify-between">
          <Badge className="h-full">{model?.pipeline}</Badge>
          <Button asChild variant="outline" className="h-8  px-3 text-xs">
            <Link target="_blank" href={model?.docs}>
              Visit Documentation
              <ArrowTopRightIcon className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
