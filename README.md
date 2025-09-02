# 🏛️ Integrated Finance Management Portal for IIT Mandi

A comprehensive web-based finance management system designed specifically for IIT Mandi that allows students, faculty, and staff to:
- Submit and track bill applications
- Manage purchase orders and supplier information
- Handle financial documentation through a streamlined interface
- Authenticate using IIT Mandi LDAP credentials
- Monitor application status in real-time

---

## 🚀 Features
- **Next.js 15** with App Router for modern React development
- **LDAP Authentication** integrated with IIT Mandi's directory services
- **Supabase** database for scalable data management
- **NextAuth.js** for secure session management
- **Responsive UI** built with TailwindCSS
- **TypeScript** for type-safe development

---

## 🛠️ Tech Stack
| Component      | Technology |
|---------------|-----------|
| Frontend       | Next.js 15 + React 19 + TypeScript |
| Styling        | TailwindCSS + Lucide Icons |
| Authentication | NextAuth.js + LDAP (ldapjs) |
| Database       | Supabase (PostgreSQL) |
| Deployment     | Vercel |
| Development    | ESLint + TypeScript |

---

## 📂 Project Documentation
- [📋 Development Workflow](./WORKFLOW.md) - Complete development process and deployment guide
- [🎯 Skills Required](./SKILLS_REQUIRED.md) - Comprehensive list of technical skills needed
- [📁 Project Structure](./PROJECT_STRUCTURE.md) - Detailed explanation of folder structure and architecture

---

## 🔧 Quick Setup
```bash
# Clone repository
git clone https://github.com/Kartavya728/integrated-finance-management-portal-for-iit-mandi.git
cd integrated-finance-management-portal-for-iit-mandi

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Configure NEXTAUTH_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 🎯 Key Features

### **Authentication System**
- **LDAP Integration** with IIT Mandi's directory service (`users.iitmandi.ac.in`)
- **Role-based Access** for students, faculty, and staff
- **Secure Sessions** with NextAuth.js JWT tokens

### **Bill Management**
- **Purchase Order Management** - Create and track POs
- **Supplier Information** - Manage vendor details and addresses
- **Item Categorization** - Organize purchases by category
- **Bill Tracking** - Monitor application status and history

### **User Interface**
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Interactive Sidebar** - Easy navigation between sections
- **Form Validation** - Real-time input validation and error handling
- **Status Dashboard** - Overview of all bill applications

---

## 🚦 Application Flow

1. **Login** → User authenticates with IIT Mandi LDAP credentials
2. **Dashboard** → View current bill applications and status
3. **Apply for Bill** → Submit new purchase order and bill information
4. **Track Status** → Monitor application progress
5. **Profile Management** → Update user information

---

## 🔐 Security Features

- **LDAP Authentication** against IIT Mandi directory
- **Row Level Security** in Supabase database
- **Environment Variables** for sensitive configuration
- **Input Validation** and sanitization
- **HTTPS Enforcement** in production

---

## 📱 User Interface

### **Main Dashboard**
- Bills status overview
- Recent applications
- Quick access to common actions

### **Bill Application Form**
- Purchase Order details
- Supplier information
- Item descriptions and quantities
- Bill numbers and values
- Indenter information

### **Navigation Sidebar**
- Dashboard access
- User profile
- Bill application form
- Settings and configuration

---

## 🔧 Development

### **Available Scripts**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint code analysis
```

### **Environment Variables**
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 📊 Database Schema

The application uses Supabase (PostgreSQL) with the following main entities:
- **Users** - IIT Mandi user information from LDAP
- **Bills** - Purchase order and bill application data
- **Suppliers** - Vendor information and details
- **Items** - Purchase item categories and descriptions

---

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### **Manual Deployment**
1. Build the application: `npm run build`
2. Deploy to your preferred hosting platform
3. Configure environment variables
4. Ensure Supabase and LDAP connectivity

---

## 🛠️ Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Submit a pull request with detailed description

---

## 📞 Support

For technical support or questions about IIT Mandi integration:
- Check the [Skills Required](./SKILLS_REQUIRED.md) document
- Review the [Development Workflow](./WORKFLOW.md) guide
- Consult the [Project Structure](./PROJECT_STRUCTURE.md) documentation

---

## 🎓 Educational Purpose

This project serves as a comprehensive example of:
- Modern full-stack web development
- LDAP integration with educational institutions
- Database design for finance applications
- Secure authentication and authorization
- Responsive UI development with React and Next.js
