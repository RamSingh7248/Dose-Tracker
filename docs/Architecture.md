# Healthcare AI Platform Architecture

## System Overview
The Healthcare AI Platform is an Enterprise Healthcare & Medication Management solution built with modern full-stack web technologies:

- **Frontend Application Layer**: React (Vite), TailwindCSS, Axios, Web Speech API, React Hot Toast.
- **Backend API Layer**: Node.js, Express.js, RESTful API architecture, Server-Sent Events (SSE).
- **Database & Persistence Layer**: MongoDB & Mongoose ORM with structured SQL schemas for audit and compliance.
- **AI & Clinical Engine**: Enterprise Multi-Provider AI Architecture with Provider Pattern (Gemini 2.0, OpenAI GPT-4o, Anthropic Claude 3.5, DeepSeek V3) & Failover Router.

```
+-------------------------------------------------------+
|                    React Frontend                     |
|         (Patient Portal / Doctor Portal / Admin)       |
+-------------------------------------------------------+
                           | REST / JSON / SSE
+-------------------------------------------------------+
|                 Node.js Express Backend               |
|  [ Auth | Meds | AI Hub Router | OCR | Analytics ]    |
+-------------------------------------------------------+
                           |
         +-----------------+-----------------+
         |                                   |
+------------------+               +-------------------+
|  MongoDB Cluster |               |  AI Providers     |
| (Database Layer) |               | (Gemini/GPT/Claude|
+------------------+               +-------------------+
```
