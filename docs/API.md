# API Endpoint Reference

## Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user account
- `POST /api/auth/login` - Authenticate & obtain JWT token
- `GET /api/auth/me` - Fetch authenticated user profile

## Enterprise AI Hub (`/api/ai-hub`)
- `POST /api/ai-hub/chat` - Process chat with multi-provider failover
- `POST /api/ai-hub/analyze-file` - Analyze medical document/image (MRI, CT, Blood report)
- `POST /api/ai-hub/scan-prescription` - OCR extraction & medication reminder generation
- `POST /api/ai-hub/clinical-assistant` - Doctor SOAP notes & clinical summary
- `GET /api/ai-hub/settings` - Fetch user AI preferences
- `PUT /api/ai-hub/settings` - Update AI provider & temperature settings
- `GET /api/ai-hub/analytics` - Fetch AI token consumption & cost analytics

## Medications (`/api/medications`)
- `GET /api/medications` - Get active medications
- `POST /api/medications` - Add a new medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Deactivate medication
