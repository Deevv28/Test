# Restaurant Management System

A comprehensive AI-powered multi-restaurant management platform with React frontend and dual backend support (Node.js + FastAPI).

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install Node.js backend dependencies
cd server && npm install && cd ..

# Install Python backend dependencies (optional)
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Setup Backend Database
```bash
# Setup Node.js backend database (recommended)
npm run setup:backend
```

### 3. Start the Application
```bash
# Start frontend (in one terminal)
npm run dev

# Start backend (in another terminal)
npm run backend
# OR specifically start Node.js backend
npm run backend:node
# OR specifically start Python backend  
npm run backend:python
```

## 🏗️ Architecture

### Frontend (React + Vite)
- **Port**: 5173
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend Options

#### Node.js Backend (Recommended)
- **Port**: 5000
- **Framework**: Express.js
- **Database**: SQLite
- **Authentication**: JWT + bcrypt
- **Features**: OTP verification, role-based access

#### FastAPI Backend (Alternative)
- **Port**: 8000
- **Framework**: FastAPI
- **Database**: SQLite
- **Authentication**: JWT + SHA-256
- **Features**: Auto-generated API docs

## 🔐 Demo Credentials

### Customer Login
- Create account through signup or use auto-login

### Restaurant Admin Login
- **Golden Spoon**: GS001 / admin123
- **Sakura Sushi**: SS002 / admin123  
- **Mama's Italian**: MI003 / admin123
- **URL**: `/admin-dashboard-secret-portal-2025`

### Super Admin Login
- **Email**: owner@restaurantai.com
- **Password**: superadmin2025
- **Security Code**: 777888
- **URL**: `/super-admin-control`

## 📱 Features

### Customer Features
- Restaurant discovery and search
- Table booking with visual table selection
- Menu browsing with dietary filters
- Pre-ordering with cart management
- Payment processing simulation
- AI-powered chat assistant

### Admin Features
- Restaurant dashboard with analytics
- Menu management (CRUD operations)
- Order management and status updates
- Booking management
- Customer data insights
- Real-time notifications

### Super Admin Features
- Platform-wide analytics
- Restaurant management
- User administration
- System monitoring
- Advanced reporting

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User/Admin/Super Admin login
- `POST /api/auth/verify-otp` - OTP verification (Node.js only)

### Public Endpoints
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `GET /api/restaurants/:id/menu` - Get restaurant menu

### Customer Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

### Admin Endpoints
- `GET /api/admin/restaurant` - Get admin's restaurant
- `GET /api/admin/dashboard` - Get dashboard analytics
- `GET /api/admin/menu` - Get menu items
- `POST /api/admin/menu` - Create menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item
- `GET /api/admin/orders` - Get restaurant orders
- `PUT /api/admin/orders/:id/status` - Update order status

### Super Admin Endpoints
- `GET /api/super-admin/dashboard` - Get platform analytics
- `GET /api/super-admin/restaurants` - Get all restaurants
- `GET /api/super-admin/users` - Get all users

## 🗄️ Database Schema

### Core Tables
- `users` / `login_users` - User accounts
- `restaurants` - Restaurant information
- `restaurant_tables` / `tables` - Table management
- `menu_items` - Menu items
- `bookings` - Table reservations
- `orders` - Customer orders
- `order_items` - Order line items

## 🔧 Development

### Important Notes

#### React StrictMode and Duplicate API Calls

In development mode, you may notice API calls appearing twice in the backend logs. This is due to React's StrictMode, which intentionally double-executes components to detect side effects. This behavior:

- **Only happens in development** - Production builds run components once
- **Is intentional React behavior** - Helps catch bugs and side effects
- **Can be safely ignored** - The duplicate calls don't affect functionality
- **Is prevented by caching** - Our app implements smart caching to minimize actual network requests

To verify this won't happen in production:
1. Run `npm run build` to create a production build
2. Run `npm run preview` to test the production build
3. Check that API calls only happen once in production

#### Data Persistence

The application now includes smart data persistence:
- **Automatic caching** - Data is cached in localStorage for 5 minutes
- **Survives page refresh** - No data loss when refreshing the page
- **Smart loading** - Only fetches new data when cache expires or is empty
- **Reduced server load** - Prevents unnecessary API calls

### Frontend Development
```bash
npm run dev
```
Access at: http://localhost:5173

### Backend Development
```bash
# Node.js backend with auto-reload
cd server && npm run dev

# FastAPI backend with auto-reload
cd backend && python run.py
```

### Database Management
```bash
# Reset and setup database
cd server && npm run setup
```

## 🚀 Production Deployment

### Frontend
```bash
npm run build
npm run preview
```

### Backend
- Update environment variables
- Change secret keys
- Configure production database
- Set up proper logging
- Enable HTTPS

## 🛡️ Security Features

- Password hashing (bcrypt/SHA-256)
- JWT token authentication
- Role-based access control
- CORS protection
- Rate limiting (Node.js backend)
- Input validation and sanitization

## 📞 Support

- **Health Check**: `/health` (Node.js) or `/` (FastAPI)
- **API Documentation**: Available at backend root URL
- **Database**: SQLite files created automatically

## 🎯 Next Steps

1. Start the backend: `npm run backend`
2. Start the frontend: `npm run dev`
3. Visit http://localhost:5173
4. Create a customer account or use admin credentials
5. Explore the full restaurant management experience!

---

**Note**: The Node.js backend is recommended for production use as it includes more advanced features like OTP verification, comprehensive validation, and better error handling.