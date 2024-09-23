const availableModels = [
  {
    id: "SG161222/RealVisXL_V4.0_Lightning",
    title: "Realistic Vision V4",
    description:
      "A streamlined version of RealVisXL_V4.0, designed for faster inference while still aiming for photorealism.",
    pipline: "Text to Image",
    image: "RealVisXL_V4.0_Lightning.png",
  },
  {
    id: "ByteDance/SDXL-Lightning",
    title: "SDXL Lightning",
    description:
      "SDXL-Lightning is a lightning-fast text-to-image generation model.",
    pipline: "Text to Image",
    image: "SDXL-Lightning.jpg",
  },
  {
    id: "timbrooks/instruct-pix2pix",
    title: "Instruct Pix2Pix",
    description:
      "A powerful diffusion model that edits images to a high-quality standard based on human-written instructions.",
    pipline: "Image to Image",
    image: "instruct-pix2pix.jpg",
  },
  {
    id: "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
    title: "Stable Video Diffusion",
    description:
      "An updated version of the stable-video-diffusion-img2vid-xt model with enhanced performance.",
    pipline: "Image to Video",
    image: "stable-video-diffusion-img2vid-xt-1-1.gif",
  },
  {
    id: "stabilityai/stable-diffusion-x4-upscaler",
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
