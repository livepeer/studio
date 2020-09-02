import { Tree } from "../TableOfContents";

const guidesTree: Tree = [
  {
    content: "Guides"
  },
  [
    [{ content: "Using Livepeer.com for live streaming", slug: "/docs" }, []],
    [
      {
        content: "How to live stream with the Livepeer.com dashboard"
      },
      [
        [
          {
            content: "How to create a stream",
            slug: "/docs/dashboard/create-a-stream"
          },
          []
        ],
        [
          {
            content: "Understanding the stream page specifications",
            slug: "/docs/dashboard/stream-page-specifications"
          },
          []
        ],
        [
          {
            content: "How to broadcast a stream session",
            slug: "/docs/dashboard/broadcast-a-stream-session"
          },
          []
        ],
        [
          {
            content: "How to set stream rendition properties",
            slug: "/docs/dashboard/stream-rendition-properties"
          },
          []
        ],
        [
          {
            content: "How to playback a stream",
            slug: "/docs/dashboard/playback-a-stream"
          },
          []
        ],
        [
          {
            content: "How to delete a stream",
            slug: "/docs/dashboard/delete-a-stream"
          },
          []
        ]
      ]
    ],
    [
      {
        content: "How to live stream with the Livepeer.com API"
      },
      [
        [
          {
            content: "How to create an API key",
            slug: "/docs/api/create-api-key"
          },
          []
        ],
        [
          {
            content: "How to get base urls",
            slug: "/docs/api/base-urls"
          },
          []
        ],
        [
          {
            content: "How to create a stream",
            slug: "/docs/api/create-a-stream"
          },
          []
        ],
        [
          {
            content: "How to broadcast a live stream",
            slug: "/docs/api/broadcast-a-live-stream"
          },
          []
        ],
        [
          {
            content: "How to playback a live stream",
            slug: "/docs/api/playback-a-live-stream"
          },
          []
        ],
        [
          {
            content: "How to list all streams",
            slug: "/docs/api/list-all-streams"
          },
          []
        ],
        [
          {
            content: "How to delete a stream",
            slug: "/docs/api/delete-a-stream"
          },
          []
        ]
      ]
    ],
    [
      {
        content: "How do you manage API keys"
      },
      [
        [
          {
            content: "When do you need an API key?",
            slug: "/docs/api-keys/when-do-you-need-an-API-key"
          },
          []
        ],
        [
          {
            content: "How to create an API key",
            slug: "/docs/api-keys/create-an-api-key"
          },
          []
        ],
        [
          {
            content: "How to delete an API key",
            slug: "/docs/api-keys/delete-an-api-key"
          },
          []
        ]
      ]
    ],
    [
      {
        content: "Feature Support Matrix",
        slug: "/docs/support-matrix"
      },
      []
    ]
  ]
];

export default guidesTree;
