import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import CloseIcon from "@mui/icons-material/Close";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import aiApi from "../../api/aiApi";
import AIMessageBubble from "./AIMessageBubble";

const INITIAL_MESSAGE =
    "Hello. I can help you understand your store data, including sales, stock levels, products, reports, and restocking recommendations.";

const SUGGESTED_QUESTIONS = [
    "What are today's sales?",
    "Which products are low in stock?",
    "What should I restock?",
    "What are the top products this month?",
    "Show sales performance for this week.",
    "Show sales by category.",
];

const MAX_MESSAGE_LENGTH = 1000;

const Backdrop = styled.div`
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    justify-content: flex-end;
    align-items: stretch;
    background: rgba(15, 23, 42, 0.24);
    backdrop-filter: blur(3px);

    @media (max-width: 720px) {
        justify-content: center;
        align-items: flex-end;
    }
`;

const Dialog = styled.section`
    width: min(460px, calc(100vw - 28px));
    height: min(720px, calc(100vh - 36px));
    margin: 18px;
    display: flex;
    flex-direction: column;
    border-radius: 22px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    box-shadow: var(--shadow-lg);
    overflow: hidden;

    @media (max-width: 720px) {
        width: 100%;
        height: min(86vh, 720px);
        margin: 0;
        border-radius: 22px 22px 0 0;
    }
`;

const Header = styled.header`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 18px 18px 14px;
    border-bottom: 1px solid var(--border-color-subtle);
`;

const TitleGroup = styled.div`
    min-width: 0;
`;

const Title = styled.h2`
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 850;
    letter-spacing: 0;
`;

const Subtitle = styled.p`
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.4;
`;

const IconButton = styled.button`
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.18s ease;

    svg {
        width: 19px;
        height: 19px;
    }

    &:hover {
        color: var(--primary-color);
        background: var(--bg-hover);
    }
`;

const MessageList = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 18px;
`;

const Suggestions = styled.div`
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 0 18px 14px;
    border-bottom: 1px solid var(--border-color-subtle);
    scrollbar-width: thin;
`;

const SuggestionButton = styled.button`
    flex: 0 0 auto;
    max-width: 230px;
    padding: 8px 11px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-pill);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 750;
    line-height: 1.2;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.18s ease;

    &:hover:not(:disabled) {
        color: var(--primary-color);
        border-color: rgba(22, 141, 255, 0.28);
        background: var(--primary-light);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.62;
    }
`;

const Composer = styled.form`
    display: grid;
    grid-template-columns: minmax(0, 1fr) 42px;
    gap: 10px;
    padding: 14px 18px 18px;
    background: var(--bg-secondary);
`;

const Textarea = styled.textarea`
    min-height: 46px;
    max-height: 130px;
    resize: vertical;
    padding: 12px 13px;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.35;

    &::placeholder {
        color: var(--text-muted);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }
`;

const SendButton = styled.button`
    width: 42px;
    height: 42px;
    align-self: end;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 15px;
    background: var(--primary-color);
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(22, 141, 255, 0.22);
    transition: all 0.18s ease;

    svg {
        width: 19px;
        height: 19px;
    }

    &:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
        box-shadow: none;
    }
`;

const ErrorText = styled.div`
    grid-column: 1 / -1;
    margin-top: -2px;
    color: var(--error-color);
    font-size: 12px;
    font-weight: 700;
`;

const ThinkingText = styled.div`
    padding: 0 18px 10px;
    color: var(--text-tertiary);
    font-size: 13px;
    font-weight: 700;
`;

function createMessage(role, content) {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
        createdAt: new Date().toISOString(),
    };
}

function getSafeErrorMessage(error) {
    const status = error?.response?.status;

    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 403) return "You do not have permission to use AI assistant.";
    if (status === 429) return "AI chat limit reached. Please try again later.";
    if (status === 400) {
        return (
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Please enter a valid message."
        );
    }

    return "AI assistant is temporarily unavailable. Please try again later.";
}

export default function AIChatModal({ isOpen, onClose }) {
    const initialMessages = useMemo(() => [createMessage("assistant", INITIAL_MESSAGE)], []);
    const [messages, setMessages] = useState(initialMessages);
    const [conversationId, setConversationId] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const messageListRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        const node = messageListRef.current;
        if (node) {
            node.scrollTop = node.scrollHeight;
        }
    }, [messages, isLoading]);

    if (!isOpen) return null;

    const sendMessage = async (nextMessage) => {
        const messageText = (nextMessage ?? inputValue).trim();

        if (!messageText) return;

        if (messageText.length > MAX_MESSAGE_LENGTH) {
            setError("Message must be less than 1000 characters.");
            textareaRef.current?.focus();
            return;
        }

        const userMessage = createMessage("user", messageText);
        setMessages((current) => [...current, userMessage]);
        setInputValue("");
        setError("");
        setIsLoading(true);

        try {
            const result = await aiApi.sendChatMessage({
                message: messageText,
                conversationId,
            });

            if (result.conversationId) {
                setConversationId(result.conversationId);
            }

            setMessages((current) => [
                ...current,
                createMessage("assistant", result.answer || "I could not prepare an answer right now."),
            ]);
        } catch (err) {
            const safeMessage = getSafeErrorMessage(err);
            setError(safeMessage);
            setMessages((current) => [...current, createMessage("assistant", safeMessage)]);
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isLoading) sendMessage();
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!isLoading) sendMessage();
        }
    };

    return (
        <Backdrop onMouseDown={onClose}>
            <Dialog
                aria-label="AI Assistant"
                aria-modal="true"
                role="dialog"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <Header>
                    <TitleGroup>
                        <Title>AI Assistant</Title>
                        <Subtitle>Ask about sales, stock, products, reports, and restocking.</Subtitle>
                    </TitleGroup>
                    <IconButton type="button" onClick={onClose} aria-label="Close AI Assistant">
                        <CloseIcon />
                    </IconButton>
                </Header>

                <MessageList ref={messageListRef} aria-live="polite">
                    {messages.map((message) => (
                        <AIMessageBubble
                            key={message.id}
                            role={message.role}
                            content={message.content}
                            createdAt={message.createdAt}
                        />
                    ))}
                </MessageList>

                <Suggestions aria-label="Suggested questions">
                    {SUGGESTED_QUESTIONS.map((question) => (
                        <SuggestionButton
                            key={question}
                            type="button"
                            disabled={isLoading}
                            onClick={() => sendMessage(question)}
                        >
                            {question}
                        </SuggestionButton>
                    ))}
                </Suggestions>

                {isLoading && <ThinkingText>AI is thinking...</ThinkingText>}

                <Composer onSubmit={handleSubmit}>
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        disabled={isLoading}
                        maxLength={MAX_MESSAGE_LENGTH + 1}
                        placeholder="Ask a question about your store data..."
                        rows={2}
                        onChange={(event) => {
                            setInputValue(event.target.value);
                            if (error) setError("");
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    <SendButton type="submit" disabled={isLoading || !inputValue.trim()}>
                        <SendRoundedIcon />
                    </SendButton>
                    {error && <ErrorText>{error}</ErrorText>}
                </Composer>
            </Dialog>
        </Backdrop>
    );
}
