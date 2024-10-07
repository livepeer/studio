import { Badge } from "components/ui/badge";
import React from "react";
import type { Output as OutputT } from "components/ModelGallery/constants";
import { Card } from "components/ui/card";

export default function Output({ output }: { output: OutputT[] }) {
  return (
    <Card className="w-full h-[69vh] mt-2 relative">
      <Badge className="absolute top-5 right-5">Output</Badge>
      <div className="flex items-center justify-center h-full">
        <div className="grid grid-cols-3 gap-4 p-10 mt-10">
          {output.map((item, index) => (
            <div key={index} className="flex items-center justify-center">
              <img
                src={item.url}
                alt={`Output ${index + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
