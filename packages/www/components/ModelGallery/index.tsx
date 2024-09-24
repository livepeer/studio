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
import { Button } from "components/ui/button";
import Image from "next/image";

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
      selectedFilters.length === 0 || selectedFilters.includes(model.pipline);
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
  const availablePipelines = [...new Set(models.map((model) => model.pipline))];
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
            {models.filter((model) => model.pipline === item).length}
          </Badge>
        </div>
      ))}
    </div>
  );
};

const CustomModelBanner = () => {
  return (
    <Card className="relative ">
      <CardHeader>
        <CardTitle>Bring Your Custom AI Models to Livepeer</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="w-1/2 text-gray-500">
          Leverage Livepeer's decentralized infrastructure to run a custom
          fine-tuned AI models or any open source models at scale. Our network
          is engineered to support diverse model architectures and deliver
          high-performance inference.
        </p>
      </CardContent>
      <CardFooter className="flex flex-row gap-4">
        <Button>Request custom model</Button>
        <Button variant="outline">Learn more</Button>
      </CardFooter>
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <Image
          src="/dashboard/ai/banner.webp"
          className="w-full h-full object-cover"
          alt="Custom Model"
          width={500}
          height={500}
        />
      </div>
    </Card>
  );
};
