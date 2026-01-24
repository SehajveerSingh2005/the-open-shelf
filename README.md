# The Open Shelf | A Spatial Reading Platform

The Open Shelf is a spatial reading platform designed for slow media consumption. It allows users to curate articles from RSS feeds and organize them on an infinite canvas, fostering deep thought and connection between ideas.

## Tech Stack

This application is built using:
*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS, shadcn/ui
*   **Routing:** React Router
*   **Backend/Database/Auth:** Supabase (PostgreSQL, Auth, Edge Functions)
*   **State Management:** React Query

## Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Supabase Configuration

This application uses Supabase for all backend services. The client configuration is located in `src/integrations/supabase/client.ts`.

**Important for Deployment:** If you are deploying this application, ensure your deployed domain (e.g., `https://your-app.vercel.app`) is added to the **Allowed Redirect URLs** in your Supabase project's Authentication settings to prevent sign-in issues.

### 3. Running Locally

Start the development server:

```bash
npm run dev
```

The application will typically be available at `http://localhost:8080`.