import React from "react";
import Badge from "../ui/Badge.jsx";

/**
 * SeverityBadge Component
 * 
 * Displays log severity with appropriate color coding.
 * Color mapping:
 * - INFO → blue
 * - WARN → yellow
 * - ERROR → red
 */
export default function SeverityBadge({ severity, size = "small" }) {
    const normalized = String(severity).toUpperCase();
    
    let tone = "blue";
    if (normalized === "ERROR") {
        tone = "red";
    } else if (normalized === "WARN" || normalized === "WARNING") {
        tone = "yellow";
    }

    return (
        <Badge tone={tone} size={size}>
            {normalized}
        </Badge>
    );
}

