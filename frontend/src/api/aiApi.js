import apiClient from "./apiClient";

const aiApi = {
    sendChatMessage: ({ message, conversationId }) =>
        apiClient
            .post("/ai/chat", {
                message,
                conversation_id: conversationId || undefined,
            })
            .then((response) => {
                const data = response.data?.data || response.data || {};

                return {
                    answer: typeof data.answer === "string" ? data.answer : "",
                    conversationId:
                        typeof data.conversation_id === "string" ? data.conversation_id : null,
                };
            }),
};

export default aiApi;
