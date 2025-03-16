import { Badge } from "components/ui/badge";
import React, { useEffect, useRef } from "react";
import type {
  Model,
  Output as OutputT,
} from "components/ModelGallery/constants";
import { Card } from "components/ui/card";
import { Label } from "components/ui/label";
import { ScrollArea } from "components/ui/scroll-area";
import { Button } from "components/ui/button";

export default function Output({
  loading,
  output = [],
  generationTime,
  model,
}: {
  loading: boolean;
  output: OutputT[];
  model: Model;
  generationTime: number;
}) {
  const downloadOutput = (item: OutputT) => {
    if (item.url) {
      window.open(item.url, "_blank");
      return;
    }
    if (item.chunks) {
      const blob = new Blob([JSON.stringify(item.chunks)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "output.json";
      document.body.appendChild(a);
      a.click();
      return;
    }
  };

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
          {loading ? (
            <div className="animate-pulse">
              <div className="w-[512px]  h-[512px] object-contain rounded-lg bg-loaderBackground border border-input" />
            </div>
          ) : (
            output.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center h-[512px]">
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
                  <ScrollArea className="bg-card p-4 rounded-lg border border-input max-h-[512px] max-w-[620px] overflow-y-auto">
                    <Label>Chunks (with timestamps)</Label>
                    {item.chunks.map((chunk, index) => (
                      <div key={index}>
                        <span className="text-muted-foreground">
                          {chunk.timestamp[0]}-{chunk.timestamp[1]}
                        </span>
                        : {chunk.text}
                      </div>
                    ))}

                    <div className="mt-4">
                      <Label>Text</Label>
                      <p>{item.text}</p>
                    </div>
                  </ScrollArea>
                ) : model.pipeline == "Segmentation" ? (
                  <SegmentationOutput
                    imageUrl={item.url}
                    masks={item.mask}
                    scores={item.scores}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={`Output ${index + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}

                {model.pipeline !== "Segmentation" && (
                  <Button
                    onClick={() => {
                      downloadOutput(item);
                    }}
                    variant="outline"
                    className="mt-2">
                    Download Output
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

function SegmentationOutput({ imageUrl, masks, scores }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && masks && scores && imageUrl) {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      const image = new Image();
      image.src = imageUrl;

      image.onload = () => {
        const width = image.width;
        const height = image.height;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        ctx.drawImage(image, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        JSON.parse(masks).forEach((mask) => {
          for (let i = 0; i < mask.length; i++) {
            for (let j = 0; j < mask[i].length; j++) {
              const pixelIndex = (i * width + j) * 4;
              if (mask[i][j] > 0.5) {
                // Apply the mask with some transparency effect
                data[pixelIndex] = data[pixelIndex] * 0.6 + 255 * 0.4; // Red
                data[pixelIndex + 1] = data[pixelIndex + 1] * 0.6; // Green
                data[pixelIndex + 2] = data[pixelIndex + 2] * 0.6; // Blue
                data[pixelIndex + 3] = 255; // Alpha
              }
            }
          }
        });

        ctx.putImageData(imageData, 0, 0);
      };
    }
  }, [masks, scores, imageUrl]);

  return <canvas ref={canvasRef} />;
}
