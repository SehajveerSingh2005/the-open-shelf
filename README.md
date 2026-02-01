# The Open Shelf | A Spatial Reading Platform

**[View Live Website](https://the-open-shelf.vercel.app)**

The Open Shelf is a non-linear repository for ideas, essays, and slow media. Designed for those who find depth in the details, it escapes the vertical "stream" of traditional social media and RSS readers, providing an infinite spatial canvas to think with what you read.

![Hero Showcase - A bird's eye view of the spatial canvas](path/to/hero-image.gif)

## Core Philosophy

Traditional reading platforms are built on the "scroll"—a vertical, chronological feed that prioritizes the new over the profound. The Open Shelf replaces the scroll with a **Spatial Canvas**. By arranging articles in two dimensions, users can see connections between disparate ideas, creating a mental map of their intellectual journey.

## Key Features

### 1. The Infinite Spatial Canvas
Break free from lists. Drag, zoom, and arrange your library on a 2D plane. The canvas remembers your layout, allowing you to cluster topics and visualize your reading history.

![Canvas Interaction Showcase](path/to/canvas-demo.gif)

### 2. Minimalist Editorial Reader
A focused reading environment that puts typography first. No distractions, just the text. Customize your font size, line height, and theme for the perfect reading experience.

![Reader View Showcase](path/to/reader-demo.png)

### 3. Integrated RSS Sync
Connect your favorite Substack newsletters, blogs, and news sources. The shelf automatically fetches and formats substantial long-form content, filtering out the noise.

### 4. Personal Stacks
Organize your findings into thematic collections. Stacks allow you to categorize your saved articles for easy retrieval and long-term storage.

![Stacks Management Showcase](path/to/stacks-demo.png)

## Tech Stack

This application is built with a focus on speed, responsiveness, and clean architecture:

*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript
*   **Animations:** Framer Motion (for spatial interactions)
*   **Styling:** Tailwind CSS + shadcn/ui
*   **Database & Auth:** Supabase (PostgreSQL)
*   **Server Logic:** Next.js API Routes / Server Actions
*   **State Management:** TanStack Query (React Query)

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

This application uses Supabase for backend services. The client configuration is located in `src/integrations/supabase/client.ts`.

**Important for Deployment:** Ensure your deployed domain (e.g., `https://the-open-shelf.vercel.app`) is added to the **Allowed Redirect URLs** in your Supabase project's Authentication settings.

### 3. Running Locally

```bash
npm run dev
```

The application will be available at `http://localhost:8080`.