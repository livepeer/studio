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

export default function Form({
  model,
  setOutput,
}: {
  model: ModelT;
  setOutput: (output: Output[]) => void;
}) {
  const { textToImage } = useApi();
  const [loading, setLoading] = useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const formInputs = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [
        key,
        model?.inputs.find(
          (input) => input.id === key && input.type === "number",
        )
          ? Number(value)
          : value,
      ]),
    );

    switch (model?.pipline) {
      case "Text to Image":
        const res = await textToImage(formInputs);
        setOutput(res.images);
        setLoading(false);
        break;
      case "image-to-image":
        console.log(formInputs);
        break;
    }
  };

  const handleReset = () => {
    const form = formRef.current;
    if (!form) return;

    model?.inputs.forEach((input) => {
      const inputElement = form.elements.namedItem(
        input.id,
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
            ),
          )}
        </>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit">Run pipeline</Button>
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
