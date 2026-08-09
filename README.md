# ⏳ TimeSync API

A robust backend service for team collaboration, project management, and task tracking. Built with **NestJS**, **Prisma**, and **PostgreSQL**.

---

## 🚀 Tech Stack

- **Framework:** NestJS (Node.js)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT with Refresh Tokens (Supports Local, Google, and GitHub)

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL running locally or via Docker

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tabyselom/timesync.git
   cd timesync
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/timesync?schema=public"
   PORT=3000
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret"
   ```

4. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the server:**
   ```bash
   npm run start:dev
   ```

---

## 📖 API Reference

### 🔐 Authentication (`/auth`)

The API supports `LOCAL`, `GOOGLE`, and `GITHUB` authentication providers.

#### Register (Local)
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

#### Login (Local)
- **POST** `/auth/login`
- **Response:**
  ```json
  {
    "accessToken": "eyJhb...",
    "refreshToken": "uuid-string"
  }
  ```

---

### 🏢 Workspaces (`/workspaces`)

Workspaces act as the top-level container for projects and team members. 
**Roles supported:** `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`.

#### Create Workspace
- **POST** `/workspaces`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
  ```json
  {
    "name": "Acme Corp",
    "slug": "acme-corp",
    "logoUrl": "https://example.com/logo.png"
  }
  ```

#### Get User Workspaces
- **GET** `/workspaces`
- **Response:**
  ```json
  [
    {
      "id": "workspace-uuid",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "role": "OWNER"
    }
  ]
  ```

---

### 📁 Projects (`/projects`)

Projects belong to a specific workspace and contain multiple tasks.

#### Create a Project
- **POST** `/workspaces/:workspaceId/projects`
- **Body:**
  ```json
  {
    "name": "Q3 Marketing Campaign",
    "slug": "q3-marketing",
    "description": "Planning and execution of Q3 deliverables."
  }
  ```

#### Get Projects by Workspace
- **GET** `/workspaces/:workspaceId/projects`

---

### ✅ Tasks (`/tasks`)

Tasks belong to projects and can be assigned to users.
**Statuses:** `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`
**Priorities:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`

#### Create a Task
- **POST** `/projects/:projectId/tasks`
- **Body:**
  ```json
  {
    "title": "Design Landing Page",
    "description": "Create Figma mockups for the new landing page.",
    "priority": "HIGH",
    "assignedToId": "user-uuid",
    "dueDate": "2026-08-15T00:00:00.000Z"
  }
  ```

#### Update Task Status
- **PATCH** `/tasks/:taskId`
- **Body:**
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```

#### Get Tasks by Project
- **GET** `/projects/:projectId/tasks?status=TODO&priority=HIGH`
- **Response:**
  ```json
  [
    {
      "id": "task-uuid",
      "title": "Design Landing Page",
      "status": "TODO",
      "priority": "HIGH",
      "assignedTo": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
  ```

---

## 🗄️ Database Schema Highlights

- **Soft Deletes:** Implemented across `User`, `Workspace`, `Project`, and `Task` via the `deletedAt` DateTime field.
- **Cascading Deletes:** Deleting a Workspace cascades to its Members and Projects. Deleting a Project cascades to its Tasks.
- **Indexes:** Optimized queries on Task status, Task assignments, and Refresh Token expirations.

---

## 🤝 Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request