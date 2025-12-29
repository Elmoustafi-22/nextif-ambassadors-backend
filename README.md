# NextIF Ambassador Platform - Backend API

A comprehensive RESTful API built with Node.js, Express, and TypeScript for managing the NextIF Ambassador Program. This backend powers both the admin and ambassador portals, providing authentication, task management, notifications, complaints, and more.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Validation**: Zod
- **Security**: express-rate-limit, CORS
- **Development**: ts-node-dev

## 📁 Project Structure

```
nextif-ambassadors-backend/
├── src/
│   ├── config/           # Configuration files (database, cloudinary)
│   ├── middlewares/      # Express middlewares (auth, error handling, validation)
│   ├── modules/          # Feature modules
│   │   ├── admin/        # Admin management
│   │   ├── ambassador/   # Ambassador management
│   │   ├── auth/         # Authentication & authorization
│   │   ├── complaint/    # Complaint system
│   │   ├── notification/ # Notification system
│   │   └── task/         # Task management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── app.ts            # Express app configuration
│   ├── routes.ts         # API route definitions
│   ├── seed.ts           # Database seeding script
│   └── server.ts         # Server entry point
├── .env                  # Environment variables
├── package.json
└── tsconfig.json
```

## 🔧 Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Cloudinary account (for file uploads)

### Setup Steps

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory with the following variables:

   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   SALT_ROUNDS=10
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_HOST=your_smtp_host
   EMAIL_PORT=587
   EMAIL_USER=your_email_address
   EMAIL_PASSWORD=your_email_password
   ```

3. **Seed the database** (optional):
   ```bash
   npx ts-node src/seed.ts
   ```
   This creates initial admin accounts for testing.

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot-reloading enabled.

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication (`/auth`)

- `POST /auth/login` - Login (admin or ambassador)
- `POST /auth/first-login` - First-time login for admin
- `POST /auth/ambassador/first-login` - First-time login for ambassador
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Admin (`/admin`)

- `GET /admin` - Get all admins (admin only)
- `POST /admin` - Create new admin (admin only)
- `GET /admin/:id` - Get admin by ID
- `PUT /admin/:id` - Update admin
- `DELETE /admin/:id` - Delete admin

### Ambassador (`/ambassador`)

- `GET /ambassador` - Get all ambassadors (admin only)
- `POST /ambassador` - Create new ambassador (admin only)
- `POST /ambassador/bulk` - Bulk create ambassadors via CSV (admin only)
- `GET /ambassador/:id` - Get ambassador by ID
- `PUT /ambassador/:id` - Update ambassador
- `DELETE /ambassador/:id` - Delete ambassador
- `PUT /ambassador/:id/force-password-reset` - Force password reset (admin only)

### Tasks (`/tasks`)

- `GET /tasks` - Get all tasks
- `POST /tasks` - Create new task (admin only)
- `GET /tasks/:id` - Get task by ID
- `PUT /tasks/:id` - Update task (admin only)
- `DELETE /tasks/:id` - Delete task (admin only)
- `POST /tasks/:id/submit` - Submit task (ambassador only)
- `GET /tasks/:id/submissions` - Get task submissions (admin only)
- `PUT /tasks/submissions/:submissionId` - Update submission status (admin only)

### Notifications (`/notifications`)

- `GET /notifications` - Get user notifications
- `POST /notifications` - Create notification (admin only)
- `PUT /notifications/:id/read` - Mark notification as read
- `DELETE /notifications/:id` - Delete notification

### Complaints (`/complaints`)

- `GET /complaints` - Get all complaints (admin) or user's complaints (ambassador)
- `POST /complaints` - Create new complaint (ambassador only)
- `GET /complaints/:id` - Get complaint by ID
- `PUT /complaints/:id` - Update complaint status (admin only)
- `DELETE /complaints/:id` - Delete complaint

## 🔐 Authentication & Authorization

### JWT Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Ambassador**: Limited access to ambassador-specific endpoints

### Middleware

- `authMiddleware` - Validates JWT token
- `roleMiddleware(['admin'])` - Restricts access to specific roles

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Password Hashing**: bcryptjs with configurable salt rounds
- **JWT Expiration**: Tokens expire after 24 hours (configurable)
- **Input Validation**: Zod schemas for request validation
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Centralized error handling middleware

## 📤 File Upload

File uploads are handled via Multer and stored in Cloudinary:

- **Supported formats**: Images, PDFs, documents
- **Max file size**: Configurable via Multer settings
- **Storage**: Cloudinary cloud storage

## 🗄️ Database Models

### Admin

- Email, password, first name, last name
- Role: "admin"
- First login flag

### Ambassador

- Email, password, first name, last name, phone, school
- Role: "ambassador"
- Force password reset flag
- First login flag

### Task

- Title, description, type (mandatory/bonus)
- Points, deadline
- Submission requirements (file/link)
- Status (active/inactive)

### Submission

- Task reference, ambassador reference
- Submitted files/links
- Status (pending/approved/rejected)
- Admin feedback

### Notification

- Recipient, title, message
- Read status, timestamp

### Complaint

- Ambassador reference, subject, description
- Status (pending/in-progress/resolved)
- Admin response

## 🧪 Development

### Code Structure

Each module follows a consistent structure:

- `*.model.ts` - Mongoose schema and model
- `*.controller.ts` - Request handlers
- `*.routes.ts` - Route definitions
- `*.validation.ts` - Zod validation schemas (where applicable)

### Adding a New Module

1. Create a new folder in `src/modules/`
2. Define the model, controller, and routes
3. Register routes in `src/routes.ts`

## 📝 Environment Variables Reference

| Variable                | Description                          | Required |
| ----------------------- | ------------------------------------ | -------- |
| `PORT`                  | Server port                          | Yes      |
| `MONGODB_URI`           | MongoDB connection string            | Yes      |
| `NODE_ENV`              | Environment (development/production) | Yes      |
| `JWT_SECRET`            | Secret key for JWT signing           | Yes      |
| `JWT_EXPIRES_IN`        | JWT token expiration time            | Yes      |
| `SALT_ROUNDS`           | bcrypt salt rounds                   | Yes      |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                | Optional |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                   | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                | Optional |
| `EMAIL_HOST`            | SMTP host                            | Optional |
| `EMAIL_PORT`            | SMTP port                            | Optional |
| `EMAIL_USER`            | Email address                        | Optional |
| `EMAIL_PASSWORD`        | Email password                       | Optional |

## 🐛 Error Handling

The API uses a centralized error handling middleware that returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information (development only)"
}
```

## 📊 Response Format

All API responses follow a consistent format:

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error message"
}
```

## 🤝 Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for type safety
3. Validate all inputs using Zod schemas
4. Add appropriate error handling
5. Test all endpoints before committing

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ for NextIF Ambassador Program**
