# Task
# Gateway Task

This is a Physical Meeting Summarizer where a user can see all their meetings, start a new one, the app detects speakers & language, generates transcript + summary + action items + executive summary, and finally have feature to email.

---

## 🖥️ Backend Setup

```bash
# Clone the repository
git clone <this-repo-url>

# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the development server
npm run dev

```
In Backend setup we need OpenAI API Key and SendGrid API Key


1. OpenAI API Key needs to be added in `backend/src/processMeeting.ts` file line number 8 

2. SendGrid API Key needs to be added in `backend/src/sendEmail.ts` file line number 18

##  🖥️ Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
