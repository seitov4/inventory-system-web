const logs = [
    {
        id: "log-1",
        timestamp: "2025-12-18 10:12:04",
        timeAgo: "2 min ago",
        severity: "info",
        source: "platform-auth",
        message: "Owner Shaizada logged in.",
    },
    {
        id: "log-2",
        timestamp: "2025-12-18 09:58:21",
        timeAgo: "16 min ago",
        severity: "warn",
        source: "inventory-worker",
        message: "Background sync for store acme-south delayed.",
    },
    {
        id: "log-3",
        timestamp: "2025-12-18 09:31:10",
        timeAgo: "43 min ago",
        severity: "error",
        source: "db-replica",
        message: "Replica lag exceeded 120s on eu-central-1.",
    },
    {
        id: "log-4",
        timestamp: "2025-12-18 09:05:10",
        timeAgo: "1 h ago",
        severity: "info",
        source: "scheduler",
        message: "Nightly analytics aggregation for all stores completed.",
    },
];

export default logs;


