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
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Switch } from "components/ui/switch";
import { Button } from "components/ui/button";
import { useRef } from "react";

export default function PlaygroundPage() {
  useLoggedIn();
  const { user } = useApi();
  const { query } = useRouter();
  const id = query.id as string;

  const model = availableModels.find((model) => model.id === id);
  const formRef = useRef<HTMLFormElement>(null);

  if (!user) {
    return <Layout />;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    console.log(formData.get("prompt"));
  };

  const handleReset = () => {
    const form = formRef.current;
    if (!form) return;

    model?.inputs.forEach((input) => {
      const inputElement = form.elements.namedItem(
        input.id
      ) as HTMLInputElement;
      if (inputElement && input.defaultValue) {
        inputElement.value = input.defaultValue.toString();
      }
    });
  };

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
          <div className="flex flex-col md:w-[30%]">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="grid w-full items-start gap-6 ">
              <fieldset className="grid gap-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Prompt
                </legend>
                {model?.inputs
                  .filter((input) => input.group === "prompt")
                  .map((input) => (
                    <div key={input.id}>
                      <Label>{input.name}</Label>
                      <div className="mt-1">{renderInput(input)}</div>
                    </div>
                  ))}
              </fieldset>
              <fieldset className="grid gap-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Settings
                </legend>
                {model?.inputs
                  .filter((input) => input.group === "settings")
                  .map((input) => (
                    <div key={input.id}>
                      <Label>{input.name}</Label>
                      <div className="mt-1">{renderInput(input)}</div>
                    </div>
                  ))}
              </fieldset>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button type="submit">Run pipline</Button>
              </div>
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

const renderInput = (input: any) => {
  switch (input.type) {
    case "textarea":
      return (
        <Textarea
          name={input.id}
          placeholder={input.description}
          defaultValue={input.defaultValue}
          required={input.required}
        />
      );
    case "number":
      return (
        <Input
          name={input.id}
          placeholder={input.description}
          required={input.required}
          type="number"
          defaultValue={input.defaultValue}
        />
      );
    default:
      return (
        <Input
          name={input.id}
          placeholder={input.description}
          required={input.required}
        />
      );
  }
};
