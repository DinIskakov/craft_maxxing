# SkillMaxxing Project Context 🚀

## Project Overview

"SkillMaxxing" is a skill acquisition web application designed to help users master any skill in 30 days. It combines structured learning plans with social accountability and competitive elements.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide React icons.
- **Backend**: FastAPI (Python), Uvicorn.
- **Database**: Supabase (PostgreSQL) for data + Authentication.
- **AI**: Integration for generating skill plans and coaching (simulated or real).

## Key Features Implemented

### 1. Authentication 🔐

- **Sign Up/Login**: Email & Password auth via Supabase.
- **Profile Setup**: Username selection and initial skill setup.
- **Protected Routes**: `/profile`, `/challenges`, etc. require login.
- **Logout**: "Sign Out" button in Profile page.
- **Persistence**: Defaults to `localStorage`. "Remember Me" checkbox exists but is currently non-functional (always persists due to Supabase JS v2 limitation handled gracefully).

### 2. Profile System 👤

- **Profile Page**: Displays user stats (wins, active challenges).
- **Skill Practice Graph**: GitHub-style contribution graph visualizing daily practice intensity.
- **Social Features**:
  - **Friend Search**: Find users by `@username`.
  - **Friend Management**: Send/Accept requests, remove friends.
  - **Challenge Integration**: "Challenge" button next to friends.

### 3. Challenges ⚔️

- **Create Challenge**: Set opponent, skill involved, and duration.
- **Dashboard**: View active and past challenges.

### 4. Skill Planning 📅

- **AI Plan Generation**: Creates a day-by-day plan for a chosen skill.
- **Daily Check-ins**: Mark progress on the plan.

## Recent Changes (Last Session)

- **Friend System**: Implemented full stack (DB table `friends`, API endpoints, Frontend UI).
- **Auth Fixes**:
  - Removed `supabase.auth.setPersistence` call which caused crashes (not supported in v2).
  - Fixed React Router v7 future flag warnings in `App.jsx`.
  - Added Logout functionality to Profile page.
- **Data Migration**: Added SQL for `friends` table (user must run manually in Supabase editor).

## Project Structure

- `frontend/src/`
  - `pages/`: Main views (ProfilePage, LoginPage, SetupPage, etc.)
  - `components/`: Reusable UI (FriendSearch, ContributionGraph, etc.)
  - `lib/`: API clients (`api.js`), Auth context (`auth-context.jsx`), Supabase client (`supabase.js`).
- `backend/`
  - `main.py`: Entry point, router inclusion.
  - `routers/`: API endpoints (`friends.py`, `profiles.py`, `challenges.py`).
  - `schemas/`: Pydantic models.
  - `core/`: Supabase client and dependencies.

### 5. Notifications 🔔

- **Bell Icon**: Persistent notification bell in page headers showing unread count badge (chess.com style).
- **Dropdown Panel**: Click the bell to see recent notifications with quick-action buttons (accept friend requests, accept challenges).
- **Auto-Polling**: Unread count refreshes every 15 seconds.
- **Notification Types**: Friend requests, friend accepted, challenge received/accepted/declined, challenge link accepted, opponent progress.
- **Mark as Read**: Individual or "mark all read" functionality.

### 6. Friends Page 👥

- **Dedicated `/friends` Route**: Separate page with three tabs: Friends, Requests, Find People.
- **Friend List**: View all friends, click to see their profile, challenge them, or remove.
- **Friend Requests**: Accept/decline incoming requests with inline action buttons. Badge count on bottom nav.
- **User Search**: Find any user by @username, send friend request or challenge directly.
- **Invite to App**: Share a signup link via native share or clipboard.

### 7. Friend Profiles 🔍

- **`/friends/:username`**: View any user's profile page.
- **Privacy-Aware**: Skills currently being learned and shared challenge history are only visible to friends. Non-friends see a "private" lock message.
- **Friend Management**: Add/remove friends, accept requests directly from their profile.
- **Challenge Links**: Generate shareable challenge invite links with a skill, deadline, and optional message.

### 8. Challenge Invite Links 🔗

- **Shareable Links**: Generate a unique link for a challenge that anyone can accept.
- **Join Page**: `/challenges/join/:code` shows challenge details and an accept button.
- **Notifications**: Creator is notified when someone accepts their link.

## Recent Changes (Last Session)

- **Notifications System**: Full-stack notification system with bell icon, unread badge, dropdown panel, and quick-action buttons.
- **Friends Page**: Dedicated friends page (`/friends`) with tabs for friends list, incoming requests, and user search.
- **Friend Profiles**: View friend's profile with their current skills, shared challenge history, and privacy controls.
- **Challenge Links**: Generate and share challenge invite links with anyone.
- **Invite to App**: Share signup links to invite friends to SkillMaxxing.
- **Bottom Nav Update**: Added Friends tab with pending request badge, replaced Skills with Profile tab.
- **Profile Page Cleanup**: Simplified friends section to a quick-link card, added notification bell to header.

## Next Steps 📝

- **Real-time Notifications**: Consider WebSocket/Supabase Realtime for instant notifications instead of polling.
- **Profile Editing**: Allow users to update avatar/bio (UI exists, backend needs verification).
- **Dashboard Widgets**: Add "Teacher Mode" or AI feedback integration.
- **Mobile Responsiveness**: Ensure all new modals and graphs work well on mobile.

## Known Issues / Limitations

- **"Remember Me"**: Checkbox is present but session persistence is effectively "always on" (`localStorage`) for now.
- **Local Development**: Testing multiple users requires Incognito mode as `localStorage` is shared on `localhost`.
- **Challenge Links Table**: Requires running updated SQL schema in Supabase SQL Editor.
