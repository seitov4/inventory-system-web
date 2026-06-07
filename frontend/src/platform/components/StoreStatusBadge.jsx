import React from "react";
import Badge from "../ui/Badge.jsx";

function getStatusTone(status) {
    const normalized = String(status).toLowerCase();
    switch (normalized) {
        case "active":
            return "green";
        case "suspended":
            return "yellow";
        case "inactive":
            return "gray";
        case "deleted":
            return "gray";
        default:
            return "gray";
    }
}

function getStatusLabel(status) {
    const normalized = String(status).toLowerCase();
    switch (normalized) {
        case "active":
            return "Active";
        case "suspended":
            return "Suspended";
        case "inactive":
            return "Inactive";
        case "deleted":
            return "Deleted";
        default:
            return status;
    }
}

export default function StoreStatusBadge({ status, size = "small" }) {
    return (
        <Badge tone={getStatusTone(status)} size={size}>
            {getStatusLabel(status)}
        </Badge>
    );
}
