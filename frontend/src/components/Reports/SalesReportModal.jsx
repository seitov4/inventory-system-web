import React, { useState } from "react";
import styled from "styled-components";
import { exportSalesReport } from "../../utils/reportGenerator";
import reportsApi from "../../api/reportsApi";

// ===== STYLED COMPONENTS =====
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
    display: flex;
    align-items: center;
    gap: 10px;
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

const FormatOption = styled.label`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 2px solid ${props => props.$selected ? 'var(--primary-color)' : 'var(--border-color)'};
    background: ${props => props.$selected ? 'var(--primary-light)' : 'var(--bg-primary)'};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--primary-color);
    }

    input {
        display: none;
    }
`;

const FormatIcon = styled.span`
    font-size: 20px;
`;

const FormatLabel = styled.span`
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.$selected ? 'var(--primary-color)' : 'var(--text-primary)'};
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
    padding: 6px 0;
    font-size: 13px;
`;

const PreviewKey = styled.span`
    color: var(--text-secondary);
`;

const PreviewValue = styled.span`
    color: var(--text-primary);
    font-weight: 500;
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
    display: flex;
    align-items: center;
    gap: 8px;

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

const WarningMessage = styled.div`
    padding: 12px 16px;
    background: var(--warning-bg);
    border: 1px solid var(--warning-color);
    border-radius: 8px;
    color: var(--warning-color);
    font-size: 13px;
    margin-bottom: 16px;
`;

// ===== COMPONENT =====
export default function SalesReportModal({ isOpen, onClose }) {
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [format, setFormat] = useState('xlsx');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [warning, setWarning] = useState('');

    if (!isOpen) return null;

    // Calculate days in range
    const daysInRange = Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    ) + 1;

    const handleDownload = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setWarning('');

        try {
            // Log the API call
            console.log(`[Reports] Fetching sales data: ${startDate} to ${endDate}`);

            // Fetch real data from API - NO FALLBACK TO MOCK DATA
            const salesData = await reportsApi.getSalesReport(startDate, endDate);

            // Log the result
            console.log(`[Reports] API returned ${Array.isArray(salesData) ? salesData.length : 0} rows`);

            // Check if we have data
            if (!Array.isArray(salesData) || salesData.length === 0) {
                // Still generate report but show warning
                setWarning('No sales found for the selected period. Report will be empty.');
            }

            // Generate and download report (works with empty data too)
            const reportData = exportSalesReport(
                salesData || [],
                new Date(startDate),
                new Date(endDate),
                format
            );

            if (reportData.isEmpty) {
                setSuccess('Report downloaded (no sales data for this period)');
            } else {
                setSuccess(`Report downloaded! ${reportData.lines.length} items, total: ${reportData.totals.totalRevenue.toFixed(2)}`);
            }
            
            // Close modal after short delay
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('[Reports] Error fetching sales data:', err);
            
            // Handle specific HTTP errors
            if (err.response) {
                const status = err.response.status;
                if (status === 401) {
                    setError('Authentication required. Please log in again.');
                } else if (status === 403) {
                    setError('You do not have permission to access sales reports.');
                } else if (status === 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(`Failed to fetch sales data (Error ${status})`);
                }
            } else if (err.request) {
                setError('Cannot connect to server. Please check your connection.');
            } else {
                setError('Failed to generate report. Please try again.');
            }
            
            // DO NOT fall back to mock data - show error instead
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        📊 Export Sales Report
                    </ModalTitle>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </ModalHeader>

                <ModalBody>
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    {warning && <WarningMessage>{warning}</WarningMessage>}
                    {success && <SuccessMessage>{success}</SuccessMessage>}

                    <FormGroup>
                        <Label>Date Range</Label>
                        <DateInputRow>
                            <div>
                                <DateInput
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    max={endDate}
                                />
                            </div>
                            <div>
                                <DateInput
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    min={startDate}
                                    max={today.toISOString().split('T')[0]}
                                />
                            </div>
                        </DateInputRow>
                    </FormGroup>

                    <FormGroup>
                        <Label>Export Format</Label>
                        <FormatSelector>
                            <FormatOption $selected={format === 'xlsx'}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="xlsx"
                                    checked={format === 'xlsx'}
                                    onChange={() => setFormat('xlsx')}
                                />
                                <FormatIcon>📗</FormatIcon>
                                <FormatLabel $selected={format === 'xlsx'}>Excel (.xlsx)</FormatLabel>
                            </FormatOption>
                            <FormatOption $selected={format === 'txt'}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="txt"
                                    checked={format === 'txt'}
                                    onChange={() => setFormat('txt')}
                                />
                                <FormatIcon>📄</FormatIcon>
                                <FormatLabel $selected={format === 'txt'}>Text (.txt)</FormatLabel>
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
                            <PreviewValue>{format.toUpperCase()}</PreviewValue>
                        </PreviewRow>
                        <PreviewRow>
                            <PreviewKey>Includes</PreviewKey>
                            <PreviewValue>Date, Product, SKU, Qty, Price, Total</PreviewValue>
                        </PreviewRow>
                        <PreviewRow>
                            <PreviewKey>Data Source</PreviewKey>
                            <PreviewValue>Real sales from database</PreviewValue>
                        </PreviewRow>
                    </PreviewSection>
                </ModalBody>

                <ModalFooter>
                    <CancelButton onClick={onClose}>Cancel</CancelButton>
                    <DownloadButton onClick={handleDownload} disabled={loading}>
                        {loading ? (
                            'Generating...'
                        ) : (
                            <>
                                ⬇️ Download Report
                            </>
                        )}
                    </DownloadButton>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
}
