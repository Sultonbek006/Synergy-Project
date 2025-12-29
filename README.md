# Synergy Platform Deployment Guide

This guide is intended for the IT developer responsible for deploying the Synergy Platform to the company server.

## Prerequisites

Ensure the following software is installed on the target server:

*   **Python 3.10+**: Required for the FastAPI backend.
*   **Node.js (v18+) & npm**: Required for building the React frontend.

## Installation

### Backend (API)

1.  Navigate to the `backend` directory (or run from root pointing to it, but typically we install requirements). From the project root:

    ```bash
    pip install -r backend/requirements.txt
    ```

### Frontend (UI)

1.  Valiate that `package.json` is present in the root directory.
2.  Install dependencies:

    ```bash
    npm install
    ```

## Secrets & Environment Variables

⚠️ **IMPORTANT**: The application relies on sensitive environment variables (e.g., Google Gemini API Keys, JWT Secrets).

**Do NOT deploy without the `.env` file.**

Please ask the project lead/administrator for the production `.env` file and place it in the **root directory** of the project.

## Deployment

### 1. Starting the Backend Server

Use `uvicorn` to run the FastAPI application. Run this command from the project **root** directory:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

*   **Host**: `0.0.0.0` (accessible externally)
*   **Port**: `8000` (default)

### 2. Building the Frontend

To build the optimized static files for production:

```bash
npm run build
```

*   This will generate a `dist/` directory containing the static assets (HTML, CSS, JS).
*   Serve the contents of the `dist/` folder using a web server (e.g., Nginx, Apache, or serve statically).
