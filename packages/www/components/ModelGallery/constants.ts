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
    defaultValue: 0.8,
    group: "settings",
  },
  {
    id: "guidance_scale",
    name: "Guidance Scale",
    type: "number",
    required: false,
    description: "The guidance scale to use for image generation",
    defaultValue: 7.5,
    group: "settings",
  },
  {
    id: "num_inference_steps",
    name: "Number of Inference Steps",
    type: "number",
    required: false,
    description: "The number of inference steps to use for image generation",
    defaultValue: 100,
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
];

const audioToTextInputs: Input[] = [
  {
    id: "audio",
    name: "Audio",
    type: "file",
    required: true,
    description: "The audio to transcribe",
    group: "prompt",
  },
];

const segmentationInputs: Input[] = [
  {
    id: "image",
    name: "Image",
    type: "segment_file",
    required: true,
    description: "The image to segment",
    group: "prompt",
  },
  {
    id: "box",
    name: "Box",
    type: "text",
    required: false,
    description: "A length 4 array given as a box prompt [x1, y1, x2, y2]",
    group: "prompt",
  },
];

const availableModels: Model[] = [
  {
    id: "RealVisXL_V4.0_Lightning",
    title: "Realistic Vision V4",
    description:
      "A lightning model designed for faster inference while still aiming for photorealism.",
    pipeline: "Text to Image",
    image: "RealVisXL_V4.0_Lightning.png",
    huggingFaceId: "SG161222/RealVisXL_V4.0_Lightning",
    docs: "https://docs.livepeer.org/api-reference/generate/text-to-image",
    lightning: true,
    inputs: textToImageInputs,
  },
  {
    id: "instruct-pix2pix",
    title: "Instruct Pix2Pix",
    description:
      "A  model that edits images based on human-written instructions.",
    pipeline: "Image to Image",
    image: "instruct-pix2pix.jpg",
    huggingFaceId: "timbrooks/instruct-pix2pix",
    docs: "https://docs.livepeer.org/api-reference/generate/image-to-image",
    inputs: imageToImageInputs,
  },
  {
    id: "stable-video-diffusion-img2vid-xt-1-1",
    title: "Stable Video Diffusion",
    description:
      "An updated version of Stable Video Diffusion Video with improved quality.",
    pipeline: "Image to Video",
    image: "stable-video-diffusion-img2vid-xt-1-1.gif",
    huggingFaceId: "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
    docs: "https://docs.livepeer.org/api-reference/generate/image-to-video",
    inputs: imageToVideoInputs,
  },
  {
    id: "stable-diffusion-x4-upscaler",
    title: "Stable Diffusion Upscaler",
    description:
      " A text-guided upscaling diffusion model trained on large LAION images ",
    pipeline: "Upscale Image",
    image: "stable-diffusion-x4-upscaler.png",
    huggingFaceId: "stabilityai/stable-diffusion-x4-upscaler",
    docs: "https://docs.livepeer.org/api-reference/generate/upscale",
    inputs: upscalerInputs,
  },
  {
    id: "whisper-large-v3",
    title: "OpenAI Whisper",
    description: " A large-v3 model trained by OpenAI for voice recognition ",
    pipeline: "Audio to Text",
    image: "whisper-large-v3.png",
    huggingFaceId: "openai/whisper-large-v3",
    docs: "https://docs.livepeer.org/api-reference/generate/audio-to-text",
    inputs: audioToTextInputs,
  },
  {
    id: "sam2-hiera-large",
    title: "Segment Anything 2",
    description:
      "SAM 2 is a segmentation model that enables precise selection of objects in image",
    pipeline: "Segmentation",
    image: "sam2-hiera-large.png",
    huggingFaceId: "facebook/sam2-hiera-large",
    docs: "https://docs.livepeer.org/api-reference/generate/segment-anything-2",
    inputs: segmentationInputs,
  },
];

type Model = {
  id: string;
  title: string;
  description: string;
  image: string;
  pipeline: string;
  lightning?: boolean;
  docs: string;
  huggingFaceId: string;
  inputs?: Input[];
};

type Input = {
  id: string;
  name: string;
  type: string;
  defaultValue?: string | number | boolean;
  required: boolean;
  disabled?: boolean;
  description: string;
  group: string;
};

type Output = {
  url?: string;
  seed?: number;
  nsfw?: boolean;
  text?: string;
  chunks?: Chunk[];
  mask?: string;
  scores?: number[];
};

type Chunk = {
  text: string;
  timestamp: [number, number];
};

export { availableModels };
export type { Model, Input, Output };
