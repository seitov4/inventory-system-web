/**
 * Product Import Modal
 * 
 * Modal dialog for importing products from CSV or XLSX files.
 * Provides file upload, preview, validation, and import functionality.
 */

import React, { useState, useRef } from "react";
import styled from "styled-components";
import { parseProductFile, downloadXLSXTemplate } from "../../services/productImportService";
import productsApi from "../../api/productsApi";

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
    max-width: 600px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
`;

const ModalHeader = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background: var(--bg-secondary);
    z-index: 1;
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

const Section = styled.div`
    margin-bottom: 24px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const SectionTitle = styled.h4`
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
`;

const Description = styled.p`
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
`;

const FileUploadArea = styled.div`
    border: 2px dashed ${props => props.$hasFile ? 'var(--success-color)' : 'var(--border-color)'};
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: ${props => props.$hasFile ? 'var(--success-bg)' : 'var(--bg-primary)'};

    &:hover {
        border-color: var(--primary-color);
        background: var(--bg-tertiary);
    }

    ${props => props.$dragOver && `
        border-color: var(--primary-color);
        background: var(--primary-light);
    `}
`;

const FileInput = styled.input`
    display: none;
`;

const UploadIcon = styled.div`
    font-size: 48px;
    margin-bottom: 12px;
`;

const UploadText = styled.div`
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
`;

const UploadHint = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
`;

const FileName = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: var(--success-color);
    margin-top: 8px;
`;

const ColumnsInfo = styled.div`
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
`;

const ColumnsTitle = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
`;

const ColumnsList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

const ColumnBadge = styled.span`
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    background: ${props => props.$required ? 'var(--error-bg)' : 'var(--bg-secondary)'};
    color: ${props => props.$required ? 'var(--error-color)' : 'var(--text-secondary)'};
    border: 1px solid ${props => props.$required ? 'var(--error-color)' : 'var(--border-color)'};
`;

const PreviewSection = styled.div`
    background: var(--bg-tertiary);
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
`;

const PreviewHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
`;

const PreviewTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
`;

const StatCard = styled.div`
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
`;

const StatValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.$color || 'var(--text-primary)'};
`;

const StatLabel = styled.div`
    font-size: 11px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    margin-top: 4px;
`;

const ErrorList = styled.div`
    max-height: 150px;
    overflow-y: auto;
    background: var(--error-bg);
    border-radius: 8px;
    padding: 12px;
    margin-top: 12px;
`;

const ErrorItem = styled.div`
    font-size: 12px;
    color: var(--error-color);
    padding: 4px 0;
    border-bottom: 1px solid rgba(248, 81, 73, 0.2);

    &:last-child {
        border-bottom: none;
    }
`;

const TemplateButton = styled.button`
    background: none;
    border: none;
    color: var(--primary-color);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;

    &:hover {
        color: var(--primary-hover);
    }
`;

const ModalFooter = styled.div`
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    bottom: 0;
    background: var(--bg-secondary);
`;

const FooterLeft = styled.div``;

const FooterRight = styled.div`
    display: flex;
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

const ImportButton = styled.button`
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

const MessageBox = styled.div`
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
    
    ${props => props.$type === 'error' && `
        background: var(--error-bg);
        border: 1px solid var(--error-color);
        color: var(--error-color);
    `}
    
    ${props => props.$type === 'success' && `
        background: var(--success-bg);
        border: 1px solid var(--success-color);
        color: var(--success-color);
    `}
`;

// ===== COMPONENT =====
export default function ProductImportModal({ isOpen, onClose, onSuccess }) {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleFileSelect = async (selectedFile) => {
        if (!selectedFile) return;

        // Validate file type
        const validTypes = ['.csv', '.xlsx', '.xls'];
        const fileExt = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
        if (!validTypes.includes(fileExt)) {
            setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
            return;
        }

        setFile(selectedFile);
        setError('');
        setSuccess('');
        setParsing(true);

        try {
            const result = await parseProductFile(selectedFile);
            setParseResult(result);
            console.log('[Import] Parsed file:', result);
        } catch (err) {
            console.error('[Import] Parse error:', err);
            setError(err.message);
            setParseResult(null);
        } finally {
            setParsing(false);
        }
    };

    const handleInputChange = (e) => {
        const selectedFile = e.target.files?.[0];
        handleFileSelect(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files?.[0];
        handleFileSelect(droppedFile);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleImport = async () => {
        if (!parseResult || parseResult.products.length === 0) {
            setError('No valid products to import');
            return;
        }

        setImporting(true);
        setError('');
        setSuccess('');

        try {
            console.log('[Import] Sending products to API:', parseResult.products.length);
            
            const result = await productsApi.importProducts(parseResult.products);
            
            console.log('[Import] API response:', result);
            
            const createdCount = result.created || result.createdCount || parseResult.products.length;
            const skippedCount = result.skipped || result.skippedCount || 0;
            
            setSuccess(`Successfully imported ${createdCount} products${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`);
            
            // Notify parent and close after delay
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            console.error('[Import] API error:', err.response || err);
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Import failed';
            setError(msg);
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParseResult(null);
        setError('');
        setSuccess('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        📥 Import Products
                    </ModalTitle>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </ModalHeader>

                <ModalBody>
                    {error && <MessageBox $type="error">{error}</MessageBox>}
                    {success && <MessageBox $type="success">{success}</MessageBox>}

                    <Section>
                        <SectionTitle>Upload File</SectionTitle>
                        <Description>
                            Upload a CSV or Excel file containing your products. 
                            The file should have column headers in the first row.
                        </Description>

                        <FileUploadArea
                            $hasFile={!!file}
                            $dragOver={dragOver}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <FileInput
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleInputChange}
                            />
                            {parsing ? (
                                <>
                                    <UploadIcon>⏳</UploadIcon>
                                    <UploadText>Parsing file...</UploadText>
                                </>
                            ) : file ? (
                                <>
                                    <UploadIcon>✅</UploadIcon>
                                    <UploadText>File selected</UploadText>
                                    <FileName>{file.name}</FileName>
                                </>
                            ) : (
                                <>
                                    <UploadIcon>📄</UploadIcon>
                                    <UploadText>
                                        Drag & drop file here or click to browse
                                    </UploadText>
                                    <UploadHint>
                                        Supported formats: CSV, XLSX, XLS
                                    </UploadHint>
                                </>
                            )}
                        </FileUploadArea>

                        <ColumnsInfo>
                            <ColumnsTitle>Required & Optional Columns</ColumnsTitle>
                            <ColumnsList>
                                <ColumnBadge $required>name *</ColumnBadge>
                                <ColumnBadge $required>sku *</ColumnBadge>
                                <ColumnBadge>barcode</ColumnBadge>
                                <ColumnBadge>purchase_price</ColumnBadge>
                                <ColumnBadge $required>sale_price *</ColumnBadge>
                                <ColumnBadge>min_stock</ColumnBadge>
                            </ColumnsList>
                        </ColumnsInfo>
                    </Section>

                    {parseResult && (
                        <PreviewSection>
                            <PreviewHeader>
                                <PreviewTitle>Import Preview</PreviewTitle>
                                <TemplateButton onClick={handleReset}>
                                    Choose different file
                                </TemplateButton>
                            </PreviewHeader>

                            <StatsGrid>
                                <StatCard>
                                    <StatValue>{parseResult.totalRows}</StatValue>
                                    <StatLabel>Total Rows</StatLabel>
                                </StatCard>
                                <StatCard>
                                    <StatValue $color="var(--success-color)">
                                        {parseResult.products.length}
                                    </StatValue>
                                    <StatLabel>Valid Products</StatLabel>
                                </StatCard>
                                <StatCard>
                                    <StatValue $color={parseResult.skipped.length > 0 ? 'var(--warning-color)' : 'var(--text-tertiary)'}>
                                        {parseResult.skipped.length}
                                    </StatValue>
                                    <StatLabel>Skipped</StatLabel>
                                </StatCard>
                            </StatsGrid>

                            {parseResult.skipped.length > 0 && (
                                <ErrorList>
                                    {parseResult.errors.slice(0, 10).map((err, idx) => (
                                        <ErrorItem key={idx}>{err}</ErrorItem>
                                    ))}
                                    {parseResult.errors.length > 10 && (
                                        <ErrorItem>
                                            ... and {parseResult.errors.length - 10} more errors
                                        </ErrorItem>
                                    )}
                                </ErrorList>
                            )}
                        </PreviewSection>
                    )}
                </ModalBody>

                <ModalFooter>
                    <FooterLeft>
                        <TemplateButton onClick={downloadXLSXTemplate}>
                            ⬇️ Download XLSX template
                        </TemplateButton>
                    </FooterLeft>
                    <FooterRight>
                        <CancelButton onClick={onClose}>Cancel</CancelButton>
                        <ImportButton
                            onClick={handleImport}
                            disabled={importing || !parseResult || parseResult.products.length === 0}
                        >
                            {importing ? 'Importing...' : `Import ${parseResult?.products.length || 0} Products`}
                        </ImportButton>
                    </FooterRight>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
}

