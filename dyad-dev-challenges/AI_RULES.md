# AI Editor Rules and Guidelines (Dyad)

This document outlines the technical stack and specific rules for using libraries within the Dyad Dev Challenges application.

## 1. Tech Stack Overview

The application is built using a modern, full-stack JavaScript ecosystem:

*   **Frontend Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Mandatory for all styling, including responsive design and dark mode support)
*   **Database & Backend Services:** Supabase (Authentication, Database, Realtime)
*   **State Management:** React Context API (`@/contexts/AuthContext` is established)
*   **Animation:** Framer Motion
*   **Icons:** `react-icons/fi` (Feather Icons) and `lucide-react` are available.
*   **UI Components:** Shadcn/ui (Preferred library for pre-built components).

## 2. Library Usage Rules

To maintain consistency and simplicity, adhere to the following rules when implementing new features or modifying existing code:

| Feature Area | Preferred Library/Tool | Rule |
| :--- | :--- | :--- |
| **Styling** | Tailwind CSS | Must be used exclusively for all component styling, layout, and responsiveness. Ensure dark mode compatibility. |
| **UI Components** | Shadcn/ui | Use pre-built Shadcn/ui components where applicable. If a component is not available, build it using standard React/TypeScript and Tailwind CSS. |
| **Icons** | `react-icons/fi` or `lucide-react` | Use icons from these packages. `react-icons/fi` is prevalent in existing code. |
| **Authentication** | `@/contexts/AuthContext` | All user authentication (sign-in, sign-up, sign-out, user status) must use the `useAuth` hook. |
| **Data Access** | `@/lib/supabaseClient` | Use the exported `supabase` client instance for all database interactions (fetching, inserting, updating). |
| **Routing** | `next/navigation` | Use Next.js App Router hooks (`useRouter`, `useParams`, etc.) for navigation. |
| **Animation** | `framer-motion` | Use for smooth transitions and engaging UI animations. |