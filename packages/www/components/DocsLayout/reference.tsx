import { Tree } from "../TableOfContents";

const referenceTree: Tree[] = [
  [
    {
      content: "Introduction",
      slug: "/docs/api",
    },
    [],
  ],
  [
    {
      content: "Authentication",
      slug: "/docs/api/authentication",
    },
    [],
  ],
  [
    {
      content: "Errors",
      slug: "/docs/api/errors",
    },
    [],
  ],
  [
    {
      content: "Stream",
    },
    [
      [
        {
          content: "The stream object",
          slug: "/docs/api/stream",
        },
        [],
      ],
      [
        {
          content: "POST create a stream object",
          slug: "/docs/api/stream/post-stream",
        },
        [],
      ],
      [
        {
          content: "GET retrieve stream object",
          slug: "/docs/api/stream/get-stream",
        },
        [],
      ],
      [
        {
          content: "GET retrieve stream session",
          slug: "/docs/api/stream/get-session",
        },
        [],
      ],
      [
        {
          content: "PATCH turn on/off recording",
          slug: "/docs/api/stream/record-on-off",
        },
        [],
      ],
      [
        {
          content: "GET list recorded sessions",
          slug: "/docs/api/stream/get-recorded-sessions",
        },
        [],
      ],
      [
        {
          content: "GET list stream objects",
          slug: "/docs/api/stream/list",
        },
        [],
      ],
    ],
  ],
  [
    {
      content: "Ingest",
      slug: "/docs/api/ingest",
    },
    [],
  ],
  [
    {
      content: "API Key",
      slug: "/docs/api/api-key",
    },
    [],
  ],
];

export default referenceTree;
