const textToImageInputs: Input[] = [
  {
    id: "prompt",
    name: "Prompt",
    type: "textarea",
    defaultValue: "A beautiful landscape with a river and mountains",
    required: true,
    description: "The prompt to generate an image from",
    group: "prompt",
  },
  {
    id: "negative_prompt",
    name: "Negative Prompt",
    type: "textarea",
    required: false,
    description: "The negative prompt to generate an image from",
    defaultValue: "bad quality, low quality, low resolution",
    group: "prompt",
  },
  {
    id: "width",
    name: "Width",
    type: "number",
    required: false,
    description: "The width of the image to generate",
    defaultValue: 512,
    group: "settings",
  },
  {
    id: "height",
    name: "Height",
    type: "number",
    required: false,
    description: "The height of the image to generate",
    defaultValue: 512,
    group: "settings",
  },
  {
    id: "guidance_scale",
    name: "Guidance Scale",
    type: "number",
    required: false,
    description: "The guidance scale to generate an image from",
    defaultValue: 5,
    group: "settings",
  },
  {
    id: "num_inference_steps",
    name: "Number of Inference Steps",
    type: "number",
    required: false,
    description: "The number of inference steps to generate an image from",
    defaultValue: 30,
    group: "settings",
  },
];

const imageToImageInputs: Input[] = [
  {
    id: "prompt",
    name: "Prompt",
    type: "textarea",
    defaultValue: "n/a",
    required: true,
    description: "The prompt to generate an image from",
    group: "prompt",
  },
  {
    id: "negative_prompt",
    name: "Negative Prompt",
    type: "textarea",
    required: false,
    description: "The negative prompt to use for image generation",
    defaultValue: "",
    group: "prompt",
  },
  {
    id: "image",
    name: "Image",
    type: "file",
    required: true,
    description: "The image to modify",
    group: "prompt",
  },
  {
    id: "strength",
    name: "Strength",
    type: "number",
    required: false,
    description: "The strength to use for image generation",
    defaultValue: 1,
    group: "settings",
  },
  {
    id: "guidance_scale",
    name: "Guidance Scale",
    type: "number",
    required: false,
    description: "The guidance scale to use for image generation",
    defaultValue: 2,
    group: "settings",
  },
  {
    id: "num_inference_steps",
    name: "Number of Inference Steps",
    type: "number",
    required: false,
    description: "The number of inference steps to use for image generation",
    defaultValue: 6,
    group: "settings",
  },
];

const upscalerInputs: Input[] = [
  {
    id: "prompt",
    name: "Prompt",
    type: "textarea",
    defaultValue: "n/a",
    required: true,
    description: "The prompt to generate an image from",
    group: "prompt",
  },
  {
    id: "image",
    name: "Image",
    type: "file",
    required: true,
    description: "The image to upscale",
    group: "prompt",
  },
  {
    id: "num_inference_steps",
    name: "Number of Inference Steps",
    type: "number",
    required: false,
    description: "The number of inference steps to use for image generation",
    defaultValue: 50,
    group: "settings",
  },
];

const imageToVideoInputs: Input[] = [
  {
    id: "image",
    name: "Image",
    type: "file",
    required: true,
    description: "The image to generate a video from",
    group: "prompt",
  },
  {
    id: "width",
    name: "Width",
    type: "number",
    required: false,
    description: "The width of the image to generate",
    defaultValue: 512,
    group: "settings",
  },
  {
    id: "height",
    name: "Height",
    type: "number",
    required: false,
    description: "The height of the image to generate",
    defaultValue: 512,
    group: "settings",
  },
  {
    id: "fps",
    name: "Frames Per Second",
    type: "number",
    required: false,
    description: "The frames per second of the video to generate",
    defaultValue: 4,
    group: "settings",
  },
  {
    id: "motionBucketId",
    name: "Motion Bucket Id",
    type: "number",
    required: false,
    description: "The frames per second of the video to generate",
    defaultValue: 127,
    group: "settings",
  },
  {
    id: "noiseAugStrength",
    name: "Noise Aug Strength",
    type: "number",
    required: false,
    description:
      "The strength of the noise augmentation to use for video generation",
    defaultValue: 0.065,
    group: "settings",
  },
];

const availableModels: Model[] = [
  {
    id: "RealVisXL_V4.0_Lightning",
    title: "Realistic Vision V4",
    description:
      "A lightning model designed for faster inference while still aiming for photorealism.",
    pipline: "Text to Image",
    image: "RealVisXL_V4.0_Lightning.png",
    modelId: "SG161222/RealVisXL_V4.0_Lightning",
    lightning: true,
    inputs: textToImageInputs,
  },
  {
    id: "instruct-pix2pix",
    title: "Instruct Pix2Pix",
    description:
      "A  model that edits images based on human-written instructions.",
    pipline: "Image to Image",
    image: "instruct-pix2pix.jpg",
    modelId: "timbrooks/instruct-pix2pix",
    inputs: imageToImageInputs,
  },
  {
    id: "stable-video-diffusion-img2vid-xt-1-1",
    title: "Stable Video Diffusion",
    description:
      "An updated version of Stable Video Diffusion Video with improved quality.",
    pipline: "Image to Video",
    image: "stable-video-diffusion-img2vid-xt-1-1.gif",
    modelId: "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
    inputs: imageToVideoInputs,
  },
  {
    id: "stable-diffusion-x4-upscaler",
    title: "Stable Diffusion Upscaler",
    description:
      " A text-guided upscaling diffusion model trained on large LAION images ",
    pipline: "Upscale Image",
    image: "stable-diffusion-x4-upscaler.png",
    modelId: "stabilityai/stable-diffusion-x4-upscaler",
    inputs: upscalerInputs,
  },
];

type Model = {
  id: string;
  title: string;
  description: string;
  image: string;
  pipline: string;
  lightning?: boolean;
  modelId: string;
  inputs?: Input[];
};

type Input = {
  id: string;
  name: string;
  type: string;
  defaultValue?: string | number;
  required: boolean;
  description: string;
  group: string;
};

type Output = {
  url: string;
  seed: number;
  nsfw: boolean;
};

export { availableModels };
export type { Model, Input, Output };
