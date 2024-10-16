// Frist-Time UX Model content
// This content can be used to display new features or important information to users when they first log in to the dashboard.
// Only the first feature with isActive: true will be displayed.

export const featuresList = [
  {
    id: "ai-gallery-playground",
    isNewFeature: true,
    title: "Introducing AI Gallery & Playground",
    description:
      "The AI Gallery and Playground in Livepeer Studio is a space where you can explore and interact with a wide range of AI models available on the network. \n\n This space is designed to be a hands-on environment where you can test, experiment, and see the full potential of each model in action, whether you're working on image generation, video generation, or other AI-driven tasks. \n\n If there’s a specific model you’d like to see or any feedback you’d like to share, just let us know, and we’ll do our best to make it happen!",
    learnMoreUrl: "https://docs.livepeer.org/",
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
