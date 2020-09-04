import { Tree } from "../TableOfContents";

const guidesTree: Tree[] = [
  [
    {
      content: "Using Livepeer.com for live streaming",
      slug: "/docs/guides",
      iconComponentName: "FiGlobe"
    },
    []
  ],
  [
    {
      content: "How to live stream with the Livepeer.com dashboard",
      iconComponentName: "FiSettings"
    },
    [
      [
        {
          content: "How to create a stream",
          slug: "/docs/guides/dashboard/create-a-stream"
        },
        []
      ],
      [
        {
          content: "Understanding the stream page specifications",
          slug: "/docs/guides/dashboard/stream-page-specifications"
        },
        []
      ],
      [
        {
          content: "How to broadcast a stream session",
          slug: "/docs/guides/dashboard/broadcast-a-stream-session"
        },
        []
      ],
      [
        {
          content: "How to set stream rendition properties",
          slug: "/docs/guides/dashboard/stream-rendition-properties"
        },
        []
      ],
      [
        {
          content: "How to playback a stream",
          slug: "/docs/guides/dashboard/playback-a-stream"
        },
        []
      ],
      [
        {
          content: "How to delete a stream",
          slug: "/docs/guides/dashboard/delete-a-stream"
        },
        []
      ]
    ]
  ],
  [
    {
      content: "How to live stream with the Livepeer.com API",
      iconComponentName: "FiSliders"
    },
    [
      [
        {
          content: "How to create an API key",
          slug: "/docs/guides/api/create-api-key"
        },
        []
      ],
      [
        {
          content: "How to get base urls",
          slug: "/docs/guides/api/base-urls"
        },
        []
      ],
      [
        {
          content: "How to create a stream",
          slug: "/docs/guides/api/create-a-stream"
        },
        []
      ],
      [
        {
          content: "How to broadcast a live stream",
          slug: "/docs/guides/api/broadcast-a-live-stream"
        },
        []
      ],
      [
        {
          content: "How to playback a live stream",
          slug: "/docs/guides/api/playback-a-live-stream"
        },
        []
      ],
      [
        {
          content: "How to list all streams",
          slug: "/docs/guides/api/list-all-streams"
        },
        []
      ],
      [
        {
          content: "How to delete a stream",
          slug: "/docs/guides/api/delete-a-stream"
        },
        []
      ]
    ]
  ],
  [
    {
      content: "How do you manage API keys",
      iconComponentName: "FiKey"
    },
    [
      [
        {
          content: "When do you need an API key?",
          slug: "/docs/guides/api-keys/when-do-you-need-an-API-key"
        },
        []
      ],
      [
        {
          content: "How to create an API key",
          slug: "/docs/guides/api-keys/create-an-api-key"
        },
        []
      ],
      [
        {
          content: "How to delete an API key",
          slug: "/docs/guides/api-keys/delete-an-api-key"
        },
        []
      ]
    ]
  ],
  [
    {
      content: "Feature Support Matrix",
      slug: "/docs/guides/support-matrix",
      iconComponentName: "FiInfo"
    },
    []
  ]
];

export default guidesTree;
