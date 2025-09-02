# 📋 Development Workflow - IIT Mandi Finance Management Portal

## 🎯 Project Overview
This is a complete finance management system for IIT Mandi that allows users to submit and track bill applications, manage purchase orders, and handle financial documentation through a web-based portal.

## 🔄 Development Workflow

### 1. **Setup Phase**
```bash
# Clone the repository
git clone https://github.com/Kartavya728/integrated-finance-management-portal-for-iit-mandi.git
cd integrated-finance-management-portal-for-iit-mandi

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Configure required environment variables (see Environment Setup below)
```

### 2. **Environment Setup**
Create `.env.local` with the following variables:
```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# LDAP Configuration (for IIT Mandi authentication)
LDAP_URL=ldap://users.iitmandi.ac.in:389
LDAP_BASE_DN=dc=iitmandi,dc=ac,dc=in
```

### 3. **Development Process**

#### **Phase 1: Frontend Development**
1. **UI Component Development**
   - Design and implement React components
   - Setup TailwindCSS styling
   - Create reusable UI components in `src/components/ui/`
   - Develop main components (`FinanceForm`, `FinanceSidebar`)

2. **Page Development**
   - Implement Next.js pages in `src/app/`
   - Setup routing structure
   - Create login page with LDAP authentication
   - Build main dashboard and bill application pages

3. **State Management**
   - Implement form state management
   - Handle user session state
   - Manage application data flow

#### **Phase 2: Authentication & Security**
1. **LDAP Integration**
   - Configure NextAuth.js with LDAP provider
   - Implement IIT Mandi LDAP authentication
   - Handle user roles (students, faculty, staff)
   - Setup session management

2. **Route Protection**
   - Implement middleware for protected routes
   - Add authentication checks
   - Handle unauthorized access

#### **Phase 3: Database Integration**
1. **Supabase Setup**
   - Configure Supabase project
   - Setup database schema for bill applications
   - Implement Row Level Security (RLS) policies
   - Configure storage buckets for file uploads

2. **API Development**
   - Create API routes for CRUD operations
   - Implement file upload handlers
   - Setup data validation
   - Error handling and logging

#### **Phase 4: Feature Implementation**
1. **Bill Management System**
   - Purchase Order (PO) creation and tracking
   - Supplier management
   - Item categorization and description
   - Bill status tracking

2. **File Management**
   - Document upload functionality
   - File validation and processing
   - Storage integration with Supabase

3. **Dashboard & Reporting**
   - Bill status dashboard
   - User profile management
   - Application history
   - Notification system

### 4. **Testing Workflow**
```bash
# Code quality checks
npm run lint          # ESLint for code quality
npm run type-check    # TypeScript type checking

# Development server
npm run dev           # Start development server

# Production build
npm run build         # Build for production
npm start             # Start production server
```

### 5. **Quality Assurance**
1. **Code Review Process**
   - Feature branch development
   - Pull request reviews
   - Code quality standards
   - Security audit

2. **Testing Strategy**
   - Unit testing for components
   - Integration testing for API routes
   - End-to-end testing for user flows
   - LDAP authentication testing

### 6. **Deployment Pipeline**

#### **Development Deployment**
```bash
# Vercel deployment (recommended)
npm install -g vercel
vercel                # Deploy to Vercel

# Or manual deployment
npm run build
npm start
```

#### **Production Deployment**
1. **Frontend Deployment (Vercel)**
   - Configure environment variables
   - Setup custom domain
   - Enable HTTPS
   - Configure performance optimization

2. **Database (Supabase)**
   - Production database setup
   - Backup strategies
   - Performance monitoring
   - Security configuration

### 7. **Maintenance Workflow**
1. **Regular Updates**
   - Dependency updates
   - Security patches
   - Performance optimization
   - Bug fixes

2. **Monitoring**
   - Error tracking
   - Performance monitoring
   - User analytics
   - Database health checks

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production version |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |

## 🚀 Deployment Options

### **Option 1: Vercel (Recommended)**
- Automatic deployments from GitHub
- Built-in Next.js optimization
- Edge functions support
- Easy environment variable management

### **Option 2: Traditional Hosting**
- VPS or dedicated server
- Docker containerization
- PM2 for process management
- Nginx reverse proxy

## 📝 Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create pull request
# Code review and testing
# Merge to main branch

# Production deployment
git checkout main
git pull origin main
npm run build
# Deploy to production
```

## 🔍 Debugging & Troubleshooting

### **Common Issues**
1. **LDAP Connection Issues**
   - Check network connectivity to IIT Mandi LDAP server
   - Verify LDAP configuration parameters
   - Test with LDAP browser tools

2. **Supabase Connection Issues**
   - Verify API keys and URL
   - Check RLS policies
   - Monitor database logs

3. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Review Next.js configuration

### **Development Tools**
- **Browser DevTools** for frontend debugging
- **Network tab** for API call inspection
- **React DevTools** for component debugging
- **Supabase Dashboard** for database monitoring