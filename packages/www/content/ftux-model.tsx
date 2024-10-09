// Frist-Time UX Model content
// This content can be used to display new features or important information to users when they first log in to the dashboard.
// Only the first feature with isActive: true will be displayed.

export const featuresList = [
  {
    id: "ai-gallery-playground",
    isNewFeature: true,
    title: "Introducing AI Gallery & Playground",
    description:
      "Projects in Livepeer Studio are a way for your organization to create dedicated and siloed environments for streams, assets, data, and developer tools like API keys and webhooks. \n\n This can be helpful for separating staging and production environments or managing multiple applications within a single account. To help you get started, we've created a default project that contains all of your existing data.",
    learnMoreUrl:
      "https://docs.livepeer.org/developers/guides/managing-projects",
    imageUrl: "/dashboard/ai/SDXL-Lightning.jpg",
    isActive: true,
  },
  {
    id: "projects",
    isNewFeature: false,
    title: "Introducing Projects",
    description:
      "Projects in Livepeer Studio are a way for your organization to create dedicated and siloed environments for streams, assets, data, and developer tools like API keys and webhooks. \n\n This can be helpful for separating staging and production environments or managing multiple applications within a single account. To help you get started, we've created a default project that contains all of your existing data.",
    learnMoreUrl:
      "https://docs.livepeer.org/developers/guides/managing-projects",
    imageUrl: "/dashboard/img/features/projects.png",
    isActive: false,
  },
];
