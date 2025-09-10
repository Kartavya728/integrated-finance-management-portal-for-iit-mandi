# Integrated Finance Management Portal for IIT Mandi

## Deployment Guide

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**
   - Sign in to Vercel and import your GitHub repository
   - Select the repository and configure the project

2. **Configure Environment Variables**
   - Add the following environment variables in Vercel project settings:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (this will be automatically set by Vercel)

3. **Deploy**
   - Vercel will automatically build and deploy your application
   - The application will be available at the URL provided by Vercel

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Start the production server**
   ```bash
   npm start
   ```

## Features

- User authentication with NextAuth.js
- Role-based access control
- Finance management dashboard
- Bill application and tracking
- Audit functionality
- Student purchase management
- Responsive design for all devices