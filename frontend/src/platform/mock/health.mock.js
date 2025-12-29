const health = {
    backend: {
        status: "ok",
        statusLabel: "OK",
        latencyMs: 112,
        latencyBudgetMs: 300,
        uptime: 99.97,
        description: "Main API cluster for inventory and POS operations.",
    },
    db: {
        status: "warning",
        statusLabel: "Warning",
        latencyMs: 210,
        latencyBudgetMs: 250,
        uptime: 99.89,
        description: "PostgreSQL primary · replica lag is slightly elevated.",
    },
    servers: [
        {
            id: "srv-eu-1",
            env: "production",
            region: "eu-central-1",
            status: "ok",
            statusLabel: "Healthy",
        },
        {
            id: "srv-eu-2",
            env: "staging",
            region: "eu-central-1",
            status: "warning",
            statusLabel: "Degraded",
        },
        {
            id: "srv-dev-1",
            env: "development",
            region: "local",
            status: "ok",
            statusLabel: "Local",
        },
    ],
};

export default health;


