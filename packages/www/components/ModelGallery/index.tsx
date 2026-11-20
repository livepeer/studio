import { Checkbox } from "components/ui/checkbox";
import { Input } from "components/ui/input";
import { Search } from "lucide-react";
import React, { useState } from "react";
import { availableModels } from "./constants";
import Model from "./model";
import { Badge } from "components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from "components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "components/ui/alert-dialog";
import { Button } from "components/ui/button";
import Image from "next/image";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { ScrollArea } from "components/ui/scroll-area";
import { useApi } from "hooks";
import { useHubspotForm } from "hooks";
import { toast } from "sonner";
import Link from "next/link";

export default function ModelGallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const filteredModels = availableModels.filter((model) => {
    const matchesSearch = model.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilters.length === 0 || selectedFilters.includes(model.pipeline);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex gap-8">
      <Filter
        searchTerm={searchTerm}
        handleSearch={handleSearch}
        models={availableModels}
        selectedFilters={selectedFilters}
        handleFilterChange={handleFilterChange}
      />
      <div className="w-3/4">
        <CustomModelBanner />
        <div className="mt-6 grid grid-cols-3 gap-6 grid-rows-3">
          {filteredModels.map((model, i) => (
            <Model key={i} model={model} />
          ))}
        </div>
      </div>
    </div>
  );
}

const Filter = ({
  searchTerm,
  handleSearch,
  selectedFilters,
  handleFilterChange,
  models,
}: {
  searchTerm: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFilters: string[];
  handleFilterChange: (filter: string) => void;
  models: typeof availableModels;
}) => {
  const availablePipelines = [
    ...new Set(models.map((model) => model.pipeline)),
  ];
  return (
    <div className="w-1/6 border-r border-input pr-8 h-[90vh] ">
      <h2 className="text-md font-medium mb-3">Filter Templates</h2>
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search..."
          className="pl-8"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      {availablePipelines.map((item) => (
        <div key={item} className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2 ">
            <Checkbox
              id={item}
              className="w-4 h-4 border-slate-400"
              checked={selectedFilters.includes(item)}
              onCheckedChange={() => handleFilterChange(item)}
            />
            <label
              htmlFor={item}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {item}
            </label>
          </div>
          <Badge variant="secondary">
            {models.filter((model) => model.pipeline === item).length}
          </Badge>
        </div>
      ))}
    </div>
  );
};

const CustomModelBanner = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="relative ">
      <CardHeader>
        <CardTitle>Bring Your Custom AI Models to Livepeer</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="w-3/5">
          Leverage Livepeer's decentralized infrastructure to run AI models at
          scale: open-source, LoRA fine-tuned, custom ML, and proprietary
          solutions. Our network supports diverse architectures, delivers
          high-performance inference, and offers seamless API integration.
        </CardDescription>
      </CardContent>
      <CardFooter className="flex flex-row gap-4">
        <Button onClick={() => setOpen(true)}>Request custom model</Button>
        <Button asChild variant="outline">
          <Link target="_blank" href="https://discord.gg/livepeer">
            Join Livepeer Community
          </Link>
        </Button>
      </CardFooter>
      <div className="absolute top-0 right-0 w-2/5 h-full">
        <Image
          src="/dashboard/ai/banner.webp"
          className="w-full h-full object-cover"
          alt="Custom Model"
          width={500}
          height={500}
        />
      </div>
      <CustomModelPopover open={open} setOpen={setOpen} />
    </Card>
  );
};

const CustomModelPopover = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { user } = useApi();
  const { handleSubmit } = useHubspotForm({
    portalId: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
    formId: process.env.NEXT_PUBLIC_HUBSPOT_REGISTER_FORM_ID,
  });

  const formInputs = [
    {
      name: "email",
      placeholder: "Email",
      type: "text",
      defaultValue: user?.email,
    },
    {
      name: "name",
      placeholder: "Name",
      type: "text",
      defaultValue: user?.firstName,
    },
    {
      name: "companyWebsite",
      placeholder: "Company Website",
      type: "text",
    },
    {
      name: "keyFeatures",
      placeholder: "Please describe the key features of the model",
      type: "textarea",
    },
    {
      name: "dependencies",
      placeholder: "What are the major dependencies for executing the model?",
      type: "textarea",
    },
    {
      name: "gpuRamRequirement",
      placeholder: "What’s the GPU RAM requirement for the model?",
      type: "textarea",
    },
    {
      name: "inputFormat",
      placeholder: "What are the input and output formats of the model?",
      type: "textarea",
    },
    {
      name: "linkToModel",
      placeholder: "Link to model (if publicly available)",
      type: "text",
    },
    {
      name: "modelAccess",
      placeholder:
        "Would you like to make this model openly accessible, or keep it private?",
      type: "text",
    },

    {
      name: "workWithLivepeer",
      placeholder:
        "Are you open to working with the Livepeer team in deploying this model?",
      type: "text",
    },
  ];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    setOpen(false);

    toast("Request submitted! We will get back to you soon.");
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Request a custom model</AlertDialogTitle>
          <AlertDialogDescription>
            You can request a custom model for your use case. We will review
            your request and get back to you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form id={"request-custom-model"} onSubmit={onSubmit}>
          <ScrollArea className="h-[500px]">
            {formInputs.map((input) => (
              <div key={input.name} className="flex flex-col space-y-1.5 mb-3">
                {input.type === "textarea" ? (
                  <Textarea
                    id={input.name}
                    required={true}
                    name={input.name}
                    defaultValue={input.defaultValue}
                    placeholder={input.placeholder}
                  />
                ) : (
                  <Input
                    id={input.name}
                    required={true}
                    name={input.name}
                    type={input.type}
                    defaultValue={input.defaultValue}
                    placeholder={input.placeholder}
                  />
                )}
              </div>
            ))}
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={() => setOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button type="submit">Submit Request</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
