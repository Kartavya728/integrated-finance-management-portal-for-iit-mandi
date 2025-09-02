# 📁 Project Structure - IIT Mandi Finance Management Portal

## 🏗️ Overall Architecture

```
integrated-finance-management-portal-for-iit-mandi/
├── 📄 Configuration Files
├── 📂 public/                  # Static assets
├── 📂 src/                    # Source code
│   ├── 📂 app/               # Next.js App Router
│   ├── 📂 components/        # React components
│   ├── 📂 lib/              # Utility libraries
│   └── 📂 types/            # TypeScript definitions
└── 📄 Documentation Files
```

## 📂 Detailed Folder Structure

### **Root Directory**
```
/
├── .git/                      # Git version control
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
├── WORKFLOW.md               # Development workflow guide
├── SKILLS_REQUIRED.md        # Required skills documentation
├── PROJECT_STRUCTURE.md      # This file
├── package.json              # Project dependencies and scripts
├── package-lock.json         # Exact dependency versions
├── tsconfig.json            # TypeScript configuration
├── next.config.ts           # Next.js configuration
├── eslint.config.mjs        # ESLint configuration
├── postcss.config.mjs       # PostCSS configuration
└── components.json          # UI components configuration
```

### **Public Directory (`/public/`)**
Static assets served directly by Next.js:
```
public/
├── iit.png                   # IIT Mandi logo
├── next.svg                  # Next.js logo
├── vercel.svg               # Vercel logo
├── file.svg                 # File icon
├── globe.svg                # Globe icon
└── window.svg               # Window icon
```

### **Source Directory (`/src/`)**

#### **App Router (`/src/app/`)**
Next.js 15 App Router structure:
```
src/app/
├── layout.tsx               # Root layout component
├── page.tsx                # Home page (dashboard)
├── globals.css             # Global CSS styles
├── favicon.ico             # Site favicon
├── login/
│   └── page.tsx            # Login page
├── apply-bill/
│   └── page.tsx            # Bill application page
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts    # NextAuth.js configuration
```

**Detailed App Structure:**

1. **`layout.tsx`** - Root layout with fonts and global styling
2. **`page.tsx`** - Main dashboard showing bill status
3. **`login/page.tsx`** - LDAP authentication interface
4. **`apply-bill/page.tsx`** - Form for bill applications
5. **`api/auth/[...nextauth]/route.ts`** - Authentication API with LDAP

#### **Components (`/src/components/`)**
React component library:
```
src/components/
├── FinanceForm.tsx          # Bill application form
├── FinanceSidebar.tsx       # Navigation sidebar
└── ui/
    └── sidebar.tsx          # Reusable sidebar component
```

**Component Details:**

1. **`FinanceForm.tsx`**
   - Form for bill applications
   - Fields: PO details, supplier info, items, etc.
   - Supabase integration for data submission
   - Input validation and error handling

2. **`FinanceSidebar.tsx`**
   - Navigation menu for the application
   - User profile display
   - Links to different sections
   - Recent bill applications list

3. **`ui/sidebar.tsx`**
   - Reusable sidebar UI component
   - Animation and interaction logic
   - Responsive design implementation

#### **Libraries (`/src/lib/`)**
Utility functions and configurations:
```
src/lib/
├── supabaseClient.ts        # Supabase client configuration
└── utils.ts                # Utility functions (cn helper)
```

**Library Details:**

1. **`supabaseClient.ts`**
   - Supabase client initialization
   - Environment variable configuration
   - Database connection setup

2. **`utils.ts`**
   - `cn()` function for conditional classes
   - TailwindCSS and clsx integration
   - Utility functions for styling

#### **Types (`/src/types/`)**
TypeScript type definitions:
```
src/types/
└── ldapjs.d.ts             # LDAP library type definitions
```

## 🔧 Configuration Files Explained

### **`package.json`**
Project configuration and dependencies:
```json
{
  "name": "integrated-finance-management-portal-for-iit-mandi",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",        // Development server
    "build": "next build",    // Production build
    "start": "next start",    // Production server
    "lint": "eslint"          // Code linting
  },
  "dependencies": {
    // Core framework
    "next": "15.5.2",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    
    // Authentication
    "next-auth": "^4.24.11",
    "ldapjs": "^3.0.7",
    
    // Database
    "@supabase/supabase-js": "^2.56.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    
    // UI and Styling
    "tailwind-merge": "^3.3.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.542.0",
    "@tabler/icons-react": "^3.34.1"
  }
}
```

### **`tsconfig.json`**
TypeScript configuration:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {
      "@/*": ["./src/*"]      // Path mapping for imports
    }
  }
}
```

### **`next.config.ts`**
Next.js configuration (currently minimal):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

## 🎯 Component Architecture

### **Authentication Flow**
```
User → Login Page → LDAP Server → NextAuth → Session → Dashboard
```

### **Data Flow**
```
Form Input → Validation → Supabase API → Database → UI Update
```

### **Navigation Structure**
```
FinanceSidebar
├── Dashboard (Bills Status)
├── My Profile
├── Apply for Bill → FinanceForm
└── Settings
```

## 📊 Database Schema (Supabase)

### **Expected Tables**
Based on the form fields in `FinanceForm.tsx`:

```sql
-- Bills table
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  po_details TEXT,
  po_date DATE,
  purchase_order_value DECIMAL,
  supplier_name TEXT,
  supplier_address TEXT,
  item_category TEXT,
  item_description TEXT,
  qty INTEGER,
  bill_no TEXT,
  bill_date DATE,
  bill_value DECIMAL,
  indenter_name TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Architecture

### **Authentication Layers**
1. **LDAP Authentication** - IIT Mandi credentials
2. **NextAuth.js Session** - Session management
3. **Route Protection** - Middleware for protected pages
4. **Row Level Security** - Supabase RLS policies

### **Data Protection**
- Environment variables for sensitive data
- HTTPS enforcement
- Input validation and sanitization
- SQL injection prevention through Supabase

## 🎨 UI/UX Architecture

### **Design System**
- **TailwindCSS** for utility-first styling
- **Responsive Design** for mobile compatibility
- **Component Library** for consistency
- **Icon System** using Lucide and Tabler icons

### **User Experience Flow**
1. **Login** → LDAP authentication
2. **Dashboard** → View bill status
3. **Apply for Bill** → Form submission
4. **Profile** → User information
5. **Settings** → Configuration options

## 🚀 Deployment Architecture

### **Frontend (Vercel)**
- Next.js application deployment
- Automatic builds from GitHub
- Environment variable management
- CDN and performance optimization

### **Backend Services**
- **Supabase** - Database and authentication
- **IIT Mandi LDAP** - User authentication
- **Next.js API Routes** - Server-side logic

## 📈 Scalability Considerations

### **Performance Optimization**
- Next.js Image component for optimized images
- Server-side rendering for faster initial loads
- Static generation where possible
- Component code splitting

### **Database Optimization**
- Proper indexing on frequently queried fields
- Row Level Security for data isolation
- Connection pooling through Supabase
- Query optimization

### **Monitoring & Maintenance**
- Error tracking and logging
- Performance monitoring
- Security updates
- Regular backup procedures

## 🔄 Future Enhancements

### **Potential Features**
- **Document Upload** - Attach bills and receipts
- **Approval Workflow** - Multi-level approval process
- **Email Notifications** - Status update notifications
- **Reporting Dashboard** - Analytics and reports
- **Mobile App** - React Native implementation
- **Bulk Operations** - Handle multiple bills
- **Integration APIs** - Connect with other IIT systems