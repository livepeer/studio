import { Badge } from "components/ui/badge";
import React from "react";
import type { Output as OutputT } from "components/ModelGallery/constants";
import { Card } from "components/ui/card";

export default function Output({
  output,
  generationTime,
}: {
  output: OutputT[];
  generationTime: number;
}) {
  return (
    <Card className="w-full h-[69vh] mt-2 relative">
      <Badge className="absolute top-5 right-5">Output</Badge>
      <Badge className="absolute bottom-5 right-5">
        {(generationTime / 1000).toFixed(2)}s
      </Badge>
      <div className="flex items-center justify-center h-full">
        <div className="mt-10">
          {output.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-[512px]">
              {item.url.includes("mp4") ? (
                <video
                  src={item.url}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : (
                <img
                  src={item.url}
                  alt={`Output ${index + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
