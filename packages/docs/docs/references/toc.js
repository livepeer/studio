const toc = [
    "references/index",
    {
        type: "category",
        label: "Stream",
        collapsible: true,
        collapsed: true,
        items: [
            "references/stream/overview",
            "references/stream/post-stream",
            "references/stream/get-stream",
            "references/stream/list",
            "references/stream/record-on-off",
            "references/stream/update-stream",
            "references/stream/delete-stream"
        ]
    },
    {
        type: "category",
        label: "Session",
        collapsible: true,
        collapsed: true,
        items: [
            "references/session/overview",
            "references/session/get-session",
            "references/session/list-sessions",
            "references/session/list-recorded-sessions"
        ]
    },
    {
        type: "category",
        label: "Multistream target",
        collapsible: true,
        collapsed: true,
        items: [
            "references/multistream-target/overview",
            "references/multistream-target/create-target",
            "references/multistream-target/get-target",
            "references/multistream-target/list-targets",
            "references/multistream-target/update-target",
            "references/multistream-target/delete-target"
        ]
    },
    {
        type: "category",
        label: "Video On Demand",
        collapsible: true,
        collapsed: true,
        items: [
            "references/vod/import",
            "references/vod/upload",
            "references/vod/list",
            "references/vod/export",
            "references/vod/list-tasks",
        ]
    },
    "references/ingest",
    "references/authentication",
    "references/errors",
    "references/api-key",
    "references/terminology"
]

module.exports = toc 