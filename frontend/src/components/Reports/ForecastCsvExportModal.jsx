import React, { useState } from "react";
import styled from "styled-components";
import reportsApi from "../../api/reportsApi";

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
    background: var(--bg-secondary);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    max-width: 480px;
    width: 90%;
    box-shadow: var(--shadow-lg);
`;

const ModalHeader = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ModalTitle = styled.h3`
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    line-height: 1;

    &:hover {
        color: var(--text-primary);
    }
`;

const ModalBody = styled.div`
    padding: 24px;
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

const Label = styled.label`
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8px;
`;

const DateInputRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
`;

const DateInput = styled.input`
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 14px;

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
    }
`;

const FormatSelector = styled.div`
    display: flex;
    gap: 12px;
`;

const FormatOption = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 2px solid var(--primary-color);
    background: var(--primary-light);
`;

const FormatLabel = styled.span`
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-color);
`;

const PreviewSection = styled.div`
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;
`;

const PreviewTitle = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
`;

const PreviewRow = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 0;
    font-size: 13px;
`;

const PreviewKey = styled.span`
    color: var(--text-secondary);
`;

const PreviewValue = styled.span`
    color: var(--text-primary);
    font-weight: 500;
    text-align: right;
`;

const ModalFooter = styled.div`
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
`;

const CancelButton = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--bg-tertiary);
    }
`;

const DownloadButton = styled.button`
    padding: 10px 24px;
    border-radius: 8px;
    border: none;
    background: var(--primary-color);
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ErrorMessage = styled.div`
    padding: 12px 16px;
    background: var(--error-bg);
    border: 1px solid var(--error-color);
    border-radius: 8px;
    color: var(--error-color);
    font-size: 13px;
    margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
    padding: 12px 16px;
    background: var(--success-bg);
    border: 1px solid var(--success-color);
    border-radius: 8px;
    color: var(--success-color);
    font-size: 13px;
    margin-bottom: 16px;
`;

function getDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
        from: thirtyDaysAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
        today: today.toISOString().split("T")[0],
    };
}

export default function ForecastCsvExportModal({ isOpen, onClose }) {
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.from);
    const [endDate, setEndDate] = useState(defaults.to);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!isOpen) return null;

    const daysInRange = Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    ) + 1;

    const handleDownload = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await reportsApi.downloadSalesForecastCsv({
                from: startDate,
                to: endDate,
                format: "realistic",
            });
            setSuccess("Forecast CSV downloaded.");
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            console.error("[Reports] Forecast CSV download failed:", err);
            if (err.response?.status === 403) {
                setError("You do not have permission to export this report.");
            } else if (err.response?.status === 401) {
                setError("Your session has expired. Please log in again.");
            } else {
                setError("Forecast CSV export failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(event) => event.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>Export Forecast CSV</ModalTitle>
                    <CloseButton onClick={onClose}>x</CloseButton>
                </ModalHeader>

                <ModalBody>
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    {success && <SuccessMessage>{success}</SuccessMessage>}

                    <FormGroup>
                        <Label>Date Range</Label>
                        <DateInputRow>
                            <DateInput
                                type="date"
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                                max={endDate}
                            />
                            <DateInput
                                type="date"
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                                min={startDate}
                                max={defaults.today}
                            />
                        </DateInputRow>
                    </FormGroup>

                    <FormGroup>
                        <Label>Export Format</Label>
                        <FormatSelector>
                            <FormatOption>
                                <FormatLabel>Forecast CSV (.csv)</FormatLabel>
                            </FormatOption>
                        </FormatSelector>
                    </FormGroup>

                    <PreviewSection>
                        <PreviewTitle>Report Preview</PreviewTitle>
                        <PreviewRow>
                            <PreviewKey>Period</PreviewKey>
                            <PreviewValue>{daysInRange} days</PreviewValue>
                        </PreviewRow>
                        <PreviewRow>
                            <PreviewKey>Format</PreviewKey>
                            <PreviewValue>CSV</PreviewValue>
                        </PreviewRow>
                        <PreviewRow>
                            <PreviewKey>Includes</PreviewKey>
                            <PreviewValue>Date, Store ID, Sales, Quantity Sold, Profit, Customer Traffic, Promotion, Holiday</PreviewValue>
                        </PreviewRow>
                        <PreviewRow>
                            <PreviewKey>Data Source</PreviewKey>
                            <PreviewValue>Real sales from database</PreviewValue>
                        </PreviewRow>
                        <PreviewRow>
                            <PreviewKey>Purpose</PreviewKey>
                            <PreviewValue>Sales forecasting dataset</PreviewValue>
                        </PreviewRow>
                    </PreviewSection>
                </ModalBody>

                <ModalFooter>
                    <CancelButton onClick={onClose}>Cancel</CancelButton>
                    <DownloadButton onClick={handleDownload} disabled={loading}>
                        {loading ? "Downloading..." : "Download Forecast CSV"}
                    </DownloadButton>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
}
