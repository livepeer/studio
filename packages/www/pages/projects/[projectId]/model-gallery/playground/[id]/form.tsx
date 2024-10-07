import React, { useRef, useState } from "react";
import type {
  Model as ModelT,
  Output,
} from "components/ModelGallery/constants";
import { Label } from "components/ui/label";
import { Button } from "components/ui/button";
import { Textarea } from "components/ui/textarea";
import { Input } from "components/ui/input";
import { useApi } from "hooks";
import { Loader2 } from "lucide-react";

export default function Form({
  model,
  setOutput,
  setGenerationTime,
}: {
  model: ModelT;
  setOutput: (output: Output[]) => void;
  setGenerationTime: (time: number) => void;
}) {
  const { textToImage, upscale } = useApi();
  const [loading, setLoading] = useState<boolean>(false);
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


    switch (model?.pipline) {
      case "Text to Image":
        const textToImageRes = await textToImage(formInputs);
        setOutput(textToImageRes.images);
        break;
      case "Upscale Image":
        const upscaleRes = await upscale(formData);
        setOutput(upscaleRes.images);
        break;
      case "image-to-image":
        break;
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
      if (inputElement && input.defaultValue) {
        inputElement.value = input.defaultValue.toString();
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
                      <div className="mt-1">{renderInput(input)}</div>
                    </div>
                  ))}
              </fieldset>
            )
          )}
        </>
      )}
      <div className="flex gap-2 justify-end">
        <Button
          disabled={loading}
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            handleReset();
          }}>
          Reset
        </Button>
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
    case "file":
      return (
        <Input
          name={input.id}
          placeholder={input.description}
          required={input.required}
          type="file"
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
