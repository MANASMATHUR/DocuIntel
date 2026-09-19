# DocuIntel API Documentation

Complete API reference for the DocuIntel Legal AI Assistant.

---

## Table of Contents

- [Authentication](#authentication)
- [Cases API](#cases-api)
- [AI Streaming API](#ai-streaming-api)
- [Health & Status](#health--status)
- [Error Handling](#error-handling)

---

## Authentication

DocuIntel uses **HTTP-only cookie authentication** (`docuintel-token`) for browser sessions. Protected API routes receive trusted identity headers (`X-User-Id`, `X-User-Email`, `X-User-Name`) set by middleware after JWT verification.

### Sign In (email/password)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "your-password"
}
```

Sets the `docuintel-token` cookie on success.

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "your-password"
}
```

Password policy: minimum 8 characters, at least one letter and one number.

### Social Sign-In (Google / Apple)

Use Auth.js via the login UI (`signIn('google')` / `signIn('apple')`), which redirects through `/api/auth/callback/*` and then `/api/auth/bridge` to issue the same `docuintel-token` cookie.

Configure separately from Google Drive integration:
- **Login:** `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- **Drive:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Current User

```http
GET /api/auth/me
Cookie: docuintel-token=<jwt>
```

### Logout

```http
POST /api/auth/logout
```

### Demo Login (development)

```http
POST /api/auth/login
Content-Type: application/json

{ "demo": true }
```

Disabled in production unless `ALLOW_DEMO_LOGIN=true`.

### Using Authentication in API Calls

From the browser, send requests with credentials so the cookie is included:

```javascript
fetch('/api/cases', { credentials: 'include' })
```

Server-side route handlers read `X-User-Id` from middleware — do not trust client-supplied identity headers.

---

## Cases API

Manage contract analysis cases.

### Create Case

Upload and analyze a new contract.

```http
POST /api/cases
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Contract document (PDF, DOCX, TXT) |
| `instructions` | String | No | Analysis focus instructions |
| `policy` | String | No | Policy JSON for risk evaluation |

**Example:**
```bash
curl -X POST https://your-domain.com/api/cases \
  -H "Authorization: Bearer <token>" \
  -F "file=@contract.pdf" \
  -F "instructions=Focus on liability clauses"
```

**Response:**
```json
{
  "caseId": "case-uuid-12345",
  "status": "processing",
  "message": "Document uploaded successfully. Analysis in progress.",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get Case

Retrieve case details and analysis results.

```http
GET /api/cases/:caseId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "caseId": "case-uuid-12345",
  "status": "completed",
  "documentName": "contract.pdf",
  "createdAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:31:45Z",
  "analysis": {
    "clauses": [
      {
        "clause_id": "clause-1",
        "text": "The Supplier shall indemnify...",
        "risk_score": 0.85,
        "severity": "high",
        "rationale": "Unlimited indemnification poses significant risk",
        "recommendation": "Add liability cap",
        "redline": "The Supplier's liability shall be limited to..."
      }
    ],
    "summary": {
      "critical": 1,
      "high": 2,
      "medium": 3,
      "low": 4
    }
  },
  "auditLog": [
    {
      "task": "document_ingestion",
      "timestamp": "2024-01-15T10:30:05Z",
      "status": "success"
    }
  ]
}
```

### List Cases

Get all cases for the authenticated user.

```http
GET /api/cases
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Page number |
| `limit` | Number | 20 | Items per page |
| `status` | String | all | Filter by status |

**Response:**
```json
{
  "cases": [
    {
      "caseId": "case-uuid-12345",
      "documentName": "contract.pdf",
      "status": "completed",
      "riskSummary": { "high": 2, "medium": 1 },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Delete Case

Remove a case and all associated data.

```http
DELETE /api/cases/:caseId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Case deleted successfully"
}
```

---

## AI Streaming API

Real-time AI responses using Server-Sent Events (SSE).

### Stream Analysis

Stream contract analysis results in real-time.

```http
GET /api/ai/stream
Authorization: Bearer <token>
Accept: text/event-stream
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `caseId` | String | No* | Case ID to analyze |
| `prompt` | String | No* | Direct analysis prompt |
| `mode` | String | No | `analyze`, `chat`, or `summarize` |

*Either `caseId` or `prompt` is required.

**Event Types:**

| Event | Description |
|-------|-------------|
| `connected` | Stream connected successfully |
| `progress` | Progress update (0-100) |
| `chunk` | Streaming text chunk |
| `analysis` | Final analysis object |
| `complete` | Stream completed |
| `error` | Error occurred |

**Example Client (JavaScript):**
```javascript
const eventSource = new EventSource(
  '/api/ai/stream?prompt=Analyze this clause&mode=analyze',
  {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }
);

eventSource.addEventListener('chunk', (event) => {
  const data = JSON.parse(event.data);
  console.log('Chunk:', data.content);
});

eventSource.addEventListener('complete', (event) => {
  console.log('Analysis complete');
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  eventSource.close();
});
```

**Event Data Examples:**

Connected:
```json
{
  "type": "connected",
  "data": { "message": "Stream connected", "mode": "analyze" },
  "timestamp": 1705312200000
}
```

Progress:
```json
{
  "type": "progress",
  "data": { "progress": 45, "message": "Analyzing clause..." },
  "timestamp": 1705312201000
}
```

Chunk:
```json
{
  "type": "chunk",
  "data": { "content": "The indemnification clause ", "chunkIndex": 1 },
  "timestamp": 1705312202000
}
```

Complete:
```json
{
  "type": "complete",
  "data": { 
    "message": "Analysis complete",
    "totalChunks": 42,
    "responseLength": 1500
  },
  "timestamp": 1705312210000
}
```

---

## Health & Status

### Health Check

Check API health status.

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "vectorStore": "ready",
    "aiProviders": 3
  }
}
```

### Provider Status

Get status of AI providers.

```http
GET /api/providers
```

**Response:**
```json
{
  "providers": [
    {
      "name": "OpenAI",
      "available": true,
      "active": true,
      "model": "gpt-4o-mini",
      "tokenBudget": 2000000
    },
    {
      "name": "Nebius",
      "available": true,
      "active": false,
      "model": "Meta-Llama-3.1-70B-Instruct",
      "tokenBudget": 1500000
    }
  ],
  "activeProvider": "OpenAI"
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `PROVIDER_ERROR` | 502 | AI provider unavailable |
| `INTERNAL_ERROR` | 500 | Server error |

### Rate Limiting

API endpoints are rate-limited:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/cases` (POST) | 10 requests | 1 minute |
| `/api/ai/stream` | 30 requests | 1 minute |
| `/api/*` (other) | 100 requests | 1 minute |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312260
```

---

## SDKs & Examples

### cURL Examples

**Create Case:**
```bash
curl -X POST https://api.docuintel.ai/api/cases \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@contract.pdf" \
  -F "instructions=Focus on liability clauses"
```

**Get Case:**
```bash
curl https://api.docuintel.ai/api/cases/case-123 \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript/TypeScript

```typescript
import { DocuIntelClient } from '@docuintel/sdk';

const client = new DocuIntelClient({
  apiKey: process.env.DOCUINTEL_API_KEY,
});

// Create case
const result = await client.cases.create({
  file: contractFile,
  instructions: 'Analyze liability clauses',
});

// Stream analysis
const stream = client.ai.stream({
  caseId: result.caseId,
  mode: 'analyze',
});

for await (const event of stream) {
  console.log(event.type, event.data);
}
```

### Python

```python
from docuintel import DocuIntelClient

client = DocuIntelClient(api_key="your-api-key")

# Create case
case = client.cases.create(
    file=open("contract.pdf", "rb"),
    instructions="Analyze liability clauses"
)

# Get results
result = client.cases.get(case.id)
print(result.analysis.summary)
```

---

## Webhooks (Coming Soon)

Register webhooks to receive analysis completion notifications.

```http
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["case.completed", "case.failed"]
}
```

---

## Support

- **Documentation**: https://docs.docuintel.ai
- **GitHub Issues**: https://github.com/yourusername/docuintel/issues
- **Email**: support@docuintel.ai
