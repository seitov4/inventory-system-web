import React from "react";
import Badge from "../ui/Badge.jsx";

/**
 * StoreStatusBadge Component
 * 
 * Displays store lifecycle status with appropriate color coding.
 * Maps lifecycle statuses to visual indicators.
 */

/**
 * Map store status to badge tone
 */
function getStatusTone(status) {
    const normalized = String(status).toLowerCase();
    switch (normalized) {
        case "provisioning":
            return "blue";
        case "active":
            return "green";
        case "suspended":
            return "yellow";
        case "archived":
            return "gray";
        default:
            return "gray";
    }
}

/**
 * Get human-readable label for status
 */
function getStatusLabel(status) {
    const normalized = String(status).toLowerCase();
    switch (normalized) {
        case "provisioning":
            return "Provisioning";
        case "active":
            return "Active";
        case "suspended":
            return "Suspended";
        case "archived":
            return "Archived";
        default:
            return status;
    }
}

export default function StoreStatusBadge({ status, size = "small" }) {
    const tone = getStatusTone(status);
    const label = getStatusLabel(status);

    return (
        <Badge tone={tone} size={size}>
            {label}
        </Badge>
    );
}

