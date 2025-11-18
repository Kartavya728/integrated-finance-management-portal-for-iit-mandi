## Integrated Finance Management Portal for IIT Mandi

An **integrated, role-based finance management portal** for IIT Mandi built with **Next.js 15**, **React 19**, **Supabase**, and **NextAuth.js**.  
It streamlines workflows such as bill application and approval, auditing, student purchases, and finance administration in a single web interface.

---

## Features

- **Authentication & Security**
  - **NextAuth.js** authentication
  - **Supabase** as the primary data layer
  - **Role-based access control** (students, PDA managers, finance admins, auditors, etc.)

- **Finance & Bills**
  - **Apply Bill** flow with upload and history tracking
  - **Bill editor** and **bill details** view
  - **Bills dashboard** for quick overview and status
  - **Audit workflows** for reviewing and validating bills

- **Modules**
  - **Finance admin** panel
  - **PDA manager** interface
  - **Student purchase** management
  - **User management** pages

- **UX & UI**
  - Modern UI built with **Radix UI** primitives and utility components
  - **Responsive layout** optimized for desktop and mobile

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI / Styling**:
  - Tailwind CSS 4
  - Radix UI components
  - Custom reusable UI primitives (buttons, dialogs, tables, sidebar, etc.)
- **Auth & Data**:
  - Supabase (`@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`)
  - NextAuth.js
- **Email & Utilities**:
  - Nodemailer
  - LDAP integration (`ldapjs`)

---

## Getting Started

### Prerequisites

- **Node.js** (LTS recommended)
- **npm** (comes with Node.js)
- Access to a **Supabase** project (for database and auth)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd integrated-finance-management-portal-for-iit-mandi
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables** (see next section), then run the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

---

## Environment Variables

Create a `.env.local` file in the project root (or set these in your deployment platform like Vercel):

- **Supabase**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

- **NextAuth**
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (usually set automatically by Vercel in production)

> **Note**: Make sure you **never commit** `.env.local` or any secrets to version control.

---

## Available Scripts

In the project directory, you can run:

- **`npm run dev`** – start the development server
- **`npm run build`** – build the app for production
- **`npm start`** – run the production build
- **`npm run lint`** – run ESLint checks

---

## Project Structure (High-Level)

Key directories:

- **`src/app`**
  - `page.tsx` – main landing/dashboard
  - `login/page.tsx` – login screen
  - `apply-bill` – bill application, upload, history, and related components
  - `bill/[id]` – individual bill view
  - `bill-editor` – bill editing workflow
  - `bills` – bills listing pages
  - `audit` – audit tools and views
  - `finance-admin` – finance admin dashboard
  - `pda-manager` – PDA manager views
  - `student-purchase` – student purchase requests
  - `api` – API routes (auth, bills, email, Supabase helpers)

- **`src/components`**
  - Shared UI components (cards, forms, sidebar, table, dialogs, inputs, etc.)

- **`src/lib` / `src/utils` / `src/providers` / `src/types`**
  - Auth utilities, Supabase clients, session handling, and shared types.

---

## Deployment

### Vercel (Recommended)

1. **Connect repository**
   - Sign in to Vercel and import this GitHub repository.
   - Vercel will detect the Next.js app automatically.

2. **Configure environment variables**
   - In your Vercel project settings, add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (usually set automatically based on the deployment URL)

3. **Deploy**
   - Vercel will build and deploy the project.
   - Access the app via the URL provided by Vercel.

---

## Contributing

Contributions, issues, and feature requests are welcome.  
Feel free to open an issue or submit a pull request to improve the portal.

---

## License

This project is intended for IIT Mandi internal use.  
Please check with the project maintainers before using it in other contexts.
