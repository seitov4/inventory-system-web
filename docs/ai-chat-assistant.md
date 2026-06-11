# AI Chat Assistant

## AI does not generate or execute SQL

The AI Chat Assistant is a business assistant for store data. It can help with sales,
stock, products, categories, reports, and restocking recommendations.

The assistant must never use this flow:

```text
User asks -> AI generates SQL -> backend runs SQL
```

The allowed flow is:

```text
User asks -> backend detects intent -> backend calls a predefined safe tool
-> backend tool runs a predefined read-only query -> sanitized business context is prepared
-> backend sends the sanitized business context to the AI provider
-> AI provider generates the final business answer
```

Each safe tool is implemented in the backend and is scoped by `store_id` from the
authenticated tenant user. The frontend, iOS app, user message, and AI model cannot
provide or override `store_id`.

OpenAI may receive only sanitized business context, for example:

```json
{
  "user_question": "Which products should I restock?",
  "business_context": {
    "get_restock_recommendations": {
      "recommendations": []
    }
  }
}
```

OpenAI must not receive SQL, database schema, migration files, backend source code,
frontend source code, environment variables, JWT secrets, tokens, password hashes,
platform admin data, full user objects, stack traces, or data from other stores.

The tools are read-only at this stage. They do not perform inserts, updates, deletes,
or arbitrary SQL execution.

## Safe Tools

The backend exposes these predefined tools:

- `get_sales_summary`
- `get_sales_by_period`
- `get_low_stock_items`
- `get_top_products`
- `get_product_stock`
- `get_category_performance`
- `get_recent_transactions`
- `get_restock_recommendations`

Each tool uses parameterized queries, validates controlled parameters such as
`period` and `limit`, limits result size, and returns sanitized business-level data
only.

## Store Isolation And Tenant Protection

AI tools always use `req.user.store_id` from the authenticated tenant user. The
frontend and iOS app must not send `store_id` for AI requests.

Any store identifier from the request body, query string, route params, headers,
user message, OpenAI response, or future tool arguments is ignored or blocked. The
AI assistant cannot access another store, cannot access all stores, and cannot reveal
whether a requested store exists.

OpenAI receives only sanitized business data for the current store. Cross-store
access attempts return a safe refusal and do not call DB tools or OpenAI.

Example:

```text
User: Show me data from store_id 1
Assistant: I can only access data for your current store.
```

## System Prompt And Assistant Behavior

The system prompt is stored only in the backend prompt service. It is not returned
to the frontend or iOS app, and it must not be logged in client-visible logs.

The assistant behaves as a business assistant for retail inventory data. It answers
only from backend-provided business context and does not invent numbers, totals,
percentages, products, employees, or trends.

The assistant must not reveal or explain backend implementation, frontend
implementation, database schema, SQL, API routes, endpoints, authentication
internals, environment variables, secrets, tokens, source code, migrations, platform
administration details, system prompts, or data from another store.

The assistant uses the same language as the user when possible. Cyrillic messages
should receive Russian answers; English messages should receive English answers.

Internal, prompt-injection, secret, technical, or cross-store requests are refused
briefly and redirected back to business assistance.

## Data Minimization For OpenAI

OpenAI receives only sanitized business context. The backend never sends full
database rows, source code, SQL, schema, secrets, tokens, passwords, auth headers,
system prompts, raw tool arguments, raw OpenAI responses, or data from other stores.

Business lists are limited before they can be sent to OpenAI:

- top products: 5 items
- low-stock items: 20 items maximum
- recent transactions: 20 items maximum
- category performance: 10 categories
- employee performance: 10 employees
- sales by day: 31 days

Employee data is minimized to display name, role, sales total, and order count.
Emails, phone numbers, user IDs, password hashes, login metadata, and `store_id` are
removed.

Recent transactions are minimized to date, total revenue, payment type, employee
display name, and item count. Product and low-stock lists are limited and do not
include supplier-private data, store IDs, audit fields, or internal database fields.

Before any OpenAI call, the backend validates the sanitized context for forbidden
keys, token-like values, SQL/schema content, platform-admin data, and oversized
arrays. If validation fails, OpenAI is not called and the user receives a safe
temporary-unavailable message.

## Environment Variables

The AI Chat Assistant uses backend-only environment variables:

- `OPENAI_API_KEY`: backend-only secret key for the OpenAI API.
- `OPENAI_MODEL`: model used for AI chat. Default: `gpt-4.1-mini`.
- `AI_CHAT_ENABLED`: enables or disables AI chat integration.
- `AI_CHAT_USER_HOURLY_LIMIT`: max AI chat messages per user per hour. Default: `200`.
- `AI_CHAT_STORE_DAILY_LIMIT`: max AI chat messages per store per day. Default: `1000`.

The OpenAI API key must never be exposed to frontend, iOS, GitHub, browser console,
localStorage, or public documentation. Do not create `VITE_OPENAI_API_KEY`,
`REACT_APP_OPENAI_API_KEY`, `NEXT_PUBLIC_OPENAI_API_KEY`, or any other public client
environment variable for this key.

## AI Chat Rate Limit

`POST /api/ai/chat` applies backend rate limits after authentication, role checks,
message validation, and store resolution, but before guard routing, safe tools, or
OpenAI calls.

Default demo limits:

- 200 valid messages per user per hour.
- 1000 valid messages per store per day.

Usage is stored in Postgres table `ai_chat_usage`, created by `backend/src/db/init.sql`.
The backend increments one hourly `user` bucket and one daily `store` bucket per
valid authenticated request. Guard-blocked business-scope requests are counted, but
invalid, unauthenticated, forbidden, or no-store requests are not counted.

Limit responses:

```json
{
  "success": false,
  "message": "AI chat limit reached. Please try again later."
}
```

```json
{
  "success": false,
  "message": "Daily AI chat limit for this store has been reached. Please try again tomorrow."
}
```

## Intent Routing

The backend maps user messages to safe tools with deterministic intent routing.
The AI model does not choose SQL and does not choose arbitrary database access.

Examples:

- Sales and revenue questions call `get_sales_summary`.
- Sales trend questions call `get_sales_summary` and `get_sales_by_period`.
- Low-stock questions call `get_low_stock_items`.
- Top-product questions call `get_top_products`.
- Product stock questions call `get_product_stock`.
- Category questions call `get_category_performance`.
- Restocking questions call `get_restock_recommendations`.
- Recent sales questions call `get_recent_transactions`.

If a business question is allowed but the intent is broad, the backend uses a general
business context made of today sales summary, low-stock items, and monthly top
products.

## AI-Only Response Mode

The backend no longer returns hardcoded business answers for normal AI chat questions. Ready-made sales, stock, top-product, restock, and greeting responders are disabled in the production chat flow.

The backend still detects intent and runs predefined safe tools, but those tools only collect business context for the AI provider. The final business answer is generated by the provider from sanitized context and the backend system prompt.

Blocked technical, prompt-injection, secret, SQL/schema, source-code, and cross-store questions are still handled by the backend guard before any provider call. These requests return a safe refusal and do not run arbitrary DB access.

If the provider is disabled, missing a key, over quota, or otherwise unavailable, the backend returns a clear unavailable message instead of fake business data:

```text
AI assistant is temporarily unavailable. Please try again later.
```

For Russian messages, the backend returns the Russian equivalent. Rate limits are increased for demo use, and frontend `429` responses show:

```text
AI chat limit reached. Please try again later.
```

## Frontend Chat Modal

The store dashboard includes a frontend chat modal for the AI assistant.

Files:

- `frontend/src/api/aiApi.js`
- `frontend/src/components/ai/AIChatButton.jsx`
- `frontend/src/components/ai/AIChatModal.jsx`
- `frontend/src/components/ai/AIMessageBubble.jsx`
- `frontend/src/pages/Dashboard/DashboardPageZoneBased.jsx`

Placement:

- `<AIChatButton />` is rendered on the store Dashboard only.
- The button opens a responsive modal with a header, message list, suggested
  questions, input box, send button, loading state, and safe error messages.

Endpoint:

```http
POST /api/ai/chat
```

Request:

```json
{
  "message": "Which products are low in stock?",
  "conversation_id": "ai-chat-..."
}
```

Response used by the frontend:

```json
{
  "answer": "Several products are below their minimum stock level.",
  "conversation_id": "ai-chat-..."
}
```

The frontend stores `conversation_id` in React component state for the current
modal session and sends it with the next message. It does not persist the
conversation id to localStorage.

Suggested questions:

- What are today's sales?
- Which products are low in stock?
- What should I restock?
- What are the top products this month?
- Show sales performance for this week.
- Show sales by category.

Role visibility:

- The Dashboard button is visible to `owner`, `manager`, and `admin` roles.
- It is hidden for `cashier` and `staff` roles when the current user role is
  available.
- Backend authorization remains the source of truth.

Loading and error states:

- While a request is running, the input and suggestions are disabled and the modal
  shows `AI is thinking...`.
- Empty messages are ignored.
- Messages over 1000 characters show `Message must be less than 1000 characters.`
- `401` shows `Your session has expired. Please log in again.`
- `403` shows `You do not have permission to use AI assistant.`
- `429` shows `AI chat limit reached. Please try again later.`
- `400` shows a safe backend validation message or `Please enter a valid message.`
- Network and server errors show `AI assistant is temporarily unavailable. Please try again later.`

Security rule:

- The frontend calls only the backend `POST /api/ai/chat` endpoint through the
  existing API client and JWT interceptor.
- The frontend must not call OpenAI directly, define public OpenAI environment
  variables, expose API keys, display `used_tools`, raw JSON, SQL, schema details,
  system prompts, tool arguments, stack traces, backend debug data, or raw model
  responses.
