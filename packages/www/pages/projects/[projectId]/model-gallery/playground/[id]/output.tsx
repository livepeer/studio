import { Badge } from "components/ui/badge";
import React from "react";
import type {
  Model,
  Output as OutputT,
} from "components/ModelGallery/constants";
import { Card } from "components/ui/card";
import { Label } from "components/ui/label";
import { ScrollArea } from "components/ui/scroll-area";

export default function Output({
  output = [],
  generationTime,
  model,
}: {
  output: OutputT[];
  model: Model;
  generationTime: number;
}) {
  return (
    <Card className="w-full h-[69vh] mt-2 relative">
      <Badge className="absolute top-5 right-5">Output</Badge>
      {generationTime !== 0 && (
        <Badge className="absolute bottom-5 right-5">
          {(generationTime / 1000).toFixed(2)}s
        </Badge>
      )}
      <div className="flex items-center justify-center h-full">
        <div className="mt-10">
          {output.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-[512px]">
              {model.pipeline == "Image to Video" ? (
                <video
                  src={item.url}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : model.pipeline == "Audio to Text" ? (
                <ScrollArea className="bg-card p-4 rounded-lg border border-input max-h-[512px] overflow-y-auto">
                  <Label>Chunks (with timestamps)</Label>
                  {item.chunks.map((chunk, index) => (
                    <div key={index}>
                      {chunk.timestamp[0]}-{chunk.timestamp[1]}: {chunk.text}
                    </div>
                  ))}

                  <div className="mt-4">
                    <Label>Text</Label>
                    <p>{item.text}</p>
                  </div>
                </ScrollArea>
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
