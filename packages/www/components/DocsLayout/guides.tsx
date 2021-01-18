import { Tree } from "../TableOfContents";

const guidesTree: Tree[] = [
  [
    {
      content: "Getting started with Livepeer.com",
      slug: "/docs/guides",
      iconComponentName: "FiGlobe",
    },
    [],
  ],
  [
    {
      content: "Supported codecs and workflows",
      slug: "/docs/guides/support-matrix",
      iconComponentName: "FiInfo",
    },
    [],
  ],
  [
    {
      content: "Debugging Stream Playback",
      slug: "/docs/guides/debugging-guide",
      iconComponentName: "FiPlayCircle",
    },
    [],
  ],
  [
    {
      content: "Live stream with the Livepeer.com API",
      iconComponentName: "FiSliders",
    },
    [
      [
        {
          content: "Overview",
          slug: "/docs/guides/api/overview",
        },
        [],
      ],
      [
        {
          content: "Create a stream",
          slug: "/docs/guides/api/create-a-stream",
        },
        [],
      ],
      [
        {
          content: "Find base urls",
          slug: "/docs/guides/api/base-urls",
        },
        [],
      ],
      [
        {
          content: "Broadcast a live stream",
          slug: "/docs/guides/api/broadcast-a-live-stream",
        },
        [],
      ],
      [
        {
          content: "Verify stream status",
          slug: "/docs/guides/api/verify-stream-status",
        },
        [],
      ],
      [
        {
          content: "Playback a live stream",
          slug: "/docs/guides/api/playback-a-live-stream",
        },
        [],
      ],
      [
        {
          content: "List all streams",
          slug: "/docs/guides/api/list-all-streams",
        },
        [],
      ],
      [
        {
          content: "Delete a stream",
          slug: "/docs/guides/api/delete-a-stream",
        },
        [],
      ],
    ],
  ],
  [
    {
      content: "Live stream with the Livepeer.com dashboard",
      iconComponentName: "FiSettings",
    },
    [
      [
        {
          content: "Overview",
          slug: "/docs/guides/dashboard/overview",
        },
        [],
      ],
      [
        {
          content: "Create a stream",
          slug: "/docs/guides/dashboard/create-a-stream",
        },
        [],
      ],
      [
        {
          content: "Ingest and playback URL pairs",
          slug: "/docs/guides/dashboard/ingest-playback-url-pair",
        },
        [],
      ],
      [
        {
          content: "Stream page specifications",
          slug: "/docs/guides/dashboard/stream-page-specifications",
        },
        [],
      ],
      [
        {
          content: "Broadcast a live stream",
          slug: "/docs/guides/dashboard/broadcast-a-stream-session",
        },
        [],
      ],
      [
        {
          content: "Set stream rendition properties",
          slug: "/docs/guides/dashboard/stream-rendition-properties",
        },
        [],
      ],
      [
        {
          content: "Playback a stream",
          slug: "/docs/guides/dashboard/playback-a-stream",
        },
        [],
      ],
      [
        {
          content: "Delete a stream",
          slug: "/docs/guides/dashboard/delete-a-stream",
        },
        [],
      ],
    ],
  ],
  [
    {
      content: "API keys",
      iconComponentName: "FiKey",
    },
    [
      [
        {
          content: "When do you need an API key?",
          slug: "/docs/guides/api-keys/when-do-you-need-an-api-key",
        },
        [],
      ],
      [
        {
          content: "Create an API key",
          slug: "/docs/guides/api-keys/create-an-api-key",
        },
        [],
      ],
      [
        {
          content: "Delete an API key",
          slug: "/docs/guides/api-keys/delete-an-api-key",
        },
        [],
      ],
    ],
  ],
  [
    {
      content: "Your Livepeer.com account",
      iconComponentName: "FiUser",
    },
    [
      [
        {
          content: "Create a Livepeer.com account",
          slug: "/docs/guides/account/create-an-account",
        },
        [],
      ],
    ],
  ],
];

export default guidesTree;
