# Enterprise Security & Compliance Guidelines

## 1. Secrets & API Key Protection
- All secret keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `JWT_SECRET`) are strictly loaded via server-side `.env` variables and NEVER exposed to frontend bundles.

## 2. JWT Authentication & Role-Based Access Control (RBAC)
- Bearer tokens are validated via `protect` middleware on all protected API routes.
- Role checks enforce strict separation between `patient`, `doctor`, and `admin` portals.

## 3. Medical Safety Guardrails
- All AI responses automatically append a mandatory medical disclaimer.
- Audit logs capture AI model execution traces and prompt lengths for compliance auditing.
