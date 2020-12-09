import { Tree } from "../TableOfContents";

const referenceTree: Tree[] = [
  [
    {
      content: "Introduction",
      slug: "/docs/api"
    },
    []
  ],
  [
    {
      content: "Authentication",
      slug: "/docs/api/authentication"
    },
    []
  ],
  [
    {
      content: "Errors",
      slug: "/docs/api/errors"
    },
    []
  ],
  [
    {
      content: "Stream"
    },
    [
      [
        {
          content: "The stream object",
          slug: "/docs/api/stream"
        },
        []
      ],
      [
        {
          content: "POST /stream",
          slug: "/docs/api/stream/post-stream"
        },
        []
      ],
      [
        {
          content: "GET /stream/<id>",
          slug: "/docs/api/stream/get-stream"
        },
        []
      ],
      [
        {
          content: "List all streams",
          slug: "/docs/api/stream/list"
        },
        []
      ]
    ]
  ],
  [
    {
      content: "Ingest",
      slug: "/docs/api/ingest"
    },
    []
  ],
  [
    {
      content: "API Key",
      slug: "/docs/api/api-key"
    },
    []
  ]
];

export default referenceTree;
