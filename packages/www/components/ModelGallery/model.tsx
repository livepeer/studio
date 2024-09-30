import React from "react";
import type { Model as ModelT } from "./constants";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Button } from "components/ui/button";
import { ExternalLink } from "lucide-react";
import { useProjectContext } from "context/ProjectContext";

export default function Model({ model }: { model: ModelT }) {
  const { appendProjectId } = useProjectContext();

  return (
    <Link href={appendProjectId(`/model-gallery/playground/${model.id}`)}>
      <Card className="">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{model.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 py-0">
          <div className="aspect-video  mb-4 relative">
            <img
              src={`/dashboard/ai/${model.image}`}
              className="w-full h-[17rem] object-cover rounded-md"
              alt={model.title}
            />
          </div>
          <p className="text-sm text-gray-600 ">{model.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 py-2">
          <ModelSource model={model} />
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

const ModelSource = ({ model }: { model: ModelT }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 rounded-full  ">
        <img
          src={"/dashboard/ai/livepeer.webp"}
          className="w-full h-full object-cover rounded-full"
          alt={model.title}
        />
      </div>
      <span className="text-sm text-gray-600">by Livepeer Network</span>
    </div>
  );
};
