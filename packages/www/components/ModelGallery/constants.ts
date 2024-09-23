const availableModels = [
  {
    id: "RealVisXL_V4.0_Lightning",
    title: "Realistic Vision V4",
    description:
      "A streamlined version of RealVisXL_V4.0, designed for faster inference while still aiming for photorealism.",
    pipline: "Text to Image",
    image: "RealVisXL_V4.0_Lightning.png",
    inputs: [
      {
        id: "prompt",
        name: "Prompt",
        type: "text",
        required: true,
        description: "The prompt to generate an image from",
        group: "promp",
      },
      {
        id: "negative_prompt",
        name: "Negative Prompt",
        type: "text",
        required: false,
        description: "The negative prompt to generate an image from",
        group: "prompt",
      },

      {
        id: "width",
        name: "Width",
        type: "number",
        required: false,
        description: "The width of the image to generate",
        group: "settings",
      },

      {
        id: "height",
        name: "Height",
        type: "number",
        required: false,
        description: "The height of the image to generate",
        group: "settings",
      },

      {
        id: "guidance_scale",
        name: "Guidance Scale",
        type: "number",
        required: false,
        description: "The guidance scale to generate an image from",
        group: "settings",
      },

      {
        id: "num_inference_steps",
        name: "Number of Inference Steps",
        type: "number",
        required: false,
        description: "The number of inference steps to generate an image from",
        group: "settings",
      },
    ],
  },
  {
    id: "SDXL-Lightning",
    title: "SDXL Lightning",
    description:
      "SDXL-Lightning is a lightning-fast text-to-image generation model.",
    pipline: "Text to Image",
    image: "SDXL-Lightning.jpg",
  },
  {
    id: "instruct-pix2pix",
    title: "Instruct Pix2Pix",
    description:
      "A powerful diffusion model that edits images to a high-quality standard based on human-written instructions.",
    pipline: "Image to Image",
    image: "instruct-pix2pix.jpg",
  },
  {
    id: "stable-video-diffusion-img2vid-xt-1-1",
    title: "Stable Video Diffusion",
    description:
      "An updated version of the stable-video-diffusion-img2vid-xt model with enhanced performance.",
    pipline: "Image to Video",
    image: "stable-video-diffusion-img2vid-xt-1-1.gif",
  },
  {
    id: "stable-diffusion-x4-upscaler",
    title: "Stable Diffusion Upscaler",
    description:
      " A text-guided upscaling diffusion model trained on large LAION images ",
    pipline: "Upscale Image",
    image: "stable-diffusion-x4-upscaler.png",
  },
];

type Model = {
  id: string;
  title: string;
  description: string;
  image: string;
  pipline: string;
};

export { availableModels };
export type { Model };
