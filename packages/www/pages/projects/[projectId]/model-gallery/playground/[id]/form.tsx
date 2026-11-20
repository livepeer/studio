import React, { useEffect, useRef, useState } from "react";
import type {
  Model as ModelT,
  Output,
} from "components/ModelGallery/constants";
import { Label } from "components/ui/label";
import { Button } from "components/ui/button";
import { Textarea } from "components/ui/textarea";
import { Input } from "components/ui/input";
import { useApi } from "hooks";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function Form({
  model,
  setOutput,
  setGenerationTime,
  loading,
  setLoading,
}: {
  model: ModelT;
  setOutput: (output: Output[]) => void;
  setGenerationTime: (time: number) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}) {
  const {
    textToImage,
    upscale,
    imageToVideo,
    imageToImage,
    audioToText,
    segmentImage,
  } = useApi();
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    setOutput([]);
    startTimeRef.current = Date.now();
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const formInputs = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [
        key,
        model?.inputs.find(
          (input) => input.id === key && input.type === "number"
        )
          ? Number(value)
          : value,
      ])
    );

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const currentTime = Date.now();
        setGenerationTime(currentTime - startTimeRef.current);
      }
    }, 100);

    try {
      switch (model?.pipeline) {
        case "Text to Image":
          const textToImageRes = await textToImage(formInputs);
          setOutput(textToImageRes.images);
          break;
        case "Upscale Image":
          const upscaleRes = await upscale(formData);
          setOutput(upscaleRes.images);
          break;
        case "Image to Video":
          const imageToVideoRes = await imageToVideo(formData);
          setOutput(imageToVideoRes.images);
          break;
        case "Image to Image":
          const imageToImageRes = await imageToImage(formData);
          setOutput(imageToImageRes.images);
          break;
        case "Audio to Text":
          const audioToTextRes = await audioToText(formData);
          setOutput(audioToTextRes);
          break;
        case "Segmentation":
          const segmentImageRes = await segmentImage(formData);

          const image = formRef.current?.elements.namedItem(
            "image"
          ) as HTMLInputElement;

          const imageUrl = URL.createObjectURL(image.files[0]);

          const box = formRef.current?.elements.namedItem(
            "box"
          ) as HTMLInputElement;

          setOutput([
            {
              url: imageUrl,
              mask: segmentImageRes.masks,
              scores: segmentImageRes.scores,
            },
          ]);
          break;
        case "image-to-image":
          break;
      }
    } catch (error) {
      toast.error("Error running pipeline");
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(false);
    startTimeRef.current = null;
  };

  const handleReset = () => {
    const form = formRef.current;
    if (!form) return;

    model?.inputs.forEach((input) => {
      const inputElement = form.elements.namedItem(
        input.id
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = input.defaultValue
          ? input.defaultValue.toString()
          : "";
      }
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid w-full items-start gap-6 ">
      {model?.inputs && (
        <>
          {[...new Set(model.inputs.map((input) => input.group))].map(
            (group) => (
              <fieldset
                key={group}
                className="grid gap-4 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium capitalize">
                  {group}
                </legend>
                {model.inputs
                  .filter((input) => input.group === group)
                  .map((input) => (
                    <div key={input.id}>
                      <Label>{input.name}</Label>
                      <div className="mt-1">{renderInput(input, formRef)}</div>
                    </div>
                  ))}
              </fieldset>
            )
          )}
        </>
      )}
      <div className="flex gap-2 justify-end">
        {model?.pipeline !== "Segmentation" && (
          <Button
            disabled={loading}
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              handleReset();
            }}>
            Reset
          </Button>
        )}
        <Button disabled={loading} type="submit">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Running...
            </>
          ) : (
            "Run pipeline"
          )}
        </Button>
      </div>
    </form>
  );
}

const renderInput = (input: any, formRef: React.RefObject<HTMLFormElement>) => {
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
    case "file":
      return (
        <Input
          name={input.id}
          placeholder={input.description}
          required={input.required}
          type="file"
        />
      );
    case "segment_file":
      return <SegmentInput formRef={formRef} input={input} />;
    default:
      return (
        <Input
          name={input.id}
          placeholder={input.description}
          required={input.required}
          disabled={input.disabled}
          type="text"
          defaultValue={input.defaultValue}
        />
      );
  }
};

const SegmentInput = ({
  formRef,
  input,
}: {
  formRef: React.RefObject<HTMLFormElement>;
  input: any;
}) => {
  const [selectedSegmentImage, setSelectedSegmentImage] = useState<
    string | null
  >(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [box, setBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (selectedSegmentImage && canvasRef.current) {
      const image = new Image();
      image.src = selectedSegmentImage;
      image.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const aspectRatio = image.height / image.width;
          canvas.width = 400; // Set a fixed width
          canvas.height = canvas.width * aspectRatio;
          setImageDimensions({ width: canvas.width, height: canvas.height });

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
      };
    }
  }, [selectedSegmentImage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedSegmentImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX =
      (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const startY =
      (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);
    setBox({ startX, startY, endX: startX, endY: startY });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !box) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const endX =
      (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const endY =
      (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);
    setBox((prevBox) => ({ ...prevBox!, endX, endY }));
    drawBox();
  };

  const handleMouseUp = () => {
    if (isDrawing && box) {
      if (formRef.current) {
        const inputElement = formRef.current.elements.namedItem(
          "box"
        ) as HTMLInputElement;
        inputElement.value = JSON.stringify([
          Math.round(box.startX),
          Math.round(box.startY),
          Math.round(box.endX),
          Math.round(box.endY),
        ]);
      }
    }

    setIsDrawing(false);
  };

  const drawBox = () => {
    if (canvasRef.current && box && selectedSegmentImage) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx && imageDimensions) {
        const image = new Image();
        image.src = selectedSegmentImage;
        image.style.borderRadius = "15px";
        image.onload = () => {
          ctx.clearRect(0, 0, imageDimensions.width, imageDimensions.height);
          ctx.drawImage(
            image,
            0,
            0,
            imageDimensions.width,
            imageDimensions.height
          );
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            box.startX,
            box.startY,
            box.endX - box.startX,
            box.endY - box.startY
          );
        };
      }
    }
  };

  return (
    <>
      <Input
        name={input.id}
        placeholder={input.description}
        required={input.required}
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith("image/")) {
            setSelectedSegmentImage(URL.createObjectURL(file));
          } else {
            setSelectedSegmentImage(null);
          }
        }}
      />
      {selectedSegmentImage && (
        <div className="mt-4">
          <Label className="font-normal">
            Optional: Draw a box around the object you want to segment
          </Label>
          <div className="relative mt-1">
            <canvas
              ref={canvasRef}
              className="w-full object-contain rounded-md border-2 border-input"
              style={{ maxWidth: "100%" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
            <button
              className="absolute top-2 right-2 bg-white/50 rounded-full p-2 shadow"
              onClick={() => {
                setSelectedSegmentImage(null);
                if (formRef.current) {
                  const inputElement = formRef.current.elements.namedItem(
                    input.id
                  ) as HTMLInputElement;
                  if (inputElement) {
                    inputElement.value = "";
                  }
                }
              }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
