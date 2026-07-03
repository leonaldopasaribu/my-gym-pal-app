# 💪 MyGymPal

A modern, responsive gym tracking and progressive overload PWA built with React, TypeScript, and Supabase — designed to help you log workouts, track PRs, and get AI-powered coaching insights.

## ✨ Features

- 📊 **Progressive Overload Tracking** - Log sets and track estimated 1RM (e1RM) improvements over time
- 🏋️ **Workout Logging** - Fast, mobile-friendly stepper UI for logging strength and cardio sessions
- 🏃 **Cardio Support** - Track duration, distance, and speed for cardio exercises
- 🧠 **AI Coach** - Context-aware coaching with plateau detection and personalized guidance
- 🎯 **Muscle Balance Dashboard** - Visualize training balance across muscle groups with per-category color coding
- 🏆 **Level & Rank System** - 11-tier progression system (Noob → Olympian) with animated progress tracking
- 📤 **Shareable Workout Cards** - Export workout summaries as PNG images
- 📱 **Installable PWA** - Fully responsive with offline-friendly, app-like experience on mobile and desktop
- 🎨 **Mono+ Dark Theme** - Space Grotesk + JetBrains Mono, deep blacks, glass surfaces

## 📸 Screenshots

<div align="center">
  <img src="https://github.com/user-attachments/assets/4b60d23a-dca4-45d2-b86d-a272d7d5e0b4" alt="MyGymPal Screenshot 1" width="30%" />
  <img src="https://github.com/user-attachments/assets/dd60a56a-6b83-4eaf-836b-a02081f42b66" alt="MyGymPal Screenshot 2" width="30%" />
  <img src="https://github.com/user-attachments/assets/e7697b72-e378-44e7-9734-b6b95282e793" alt="MyGymPal Screenshot 3" width="30%" />
</div>

<div align="center">
  <img src="https://github.com/user-attachments/assets/cecc87f2-e8b8-4f39-9024-842a41550350" alt="MyGymPal Screenshot 4" width="30%" />
  <img src="https://github.com/user-attachments/assets/34b42522-9b42-4398-a87c-84c0c1035046" alt="MyGymPal Screenshot 5" width="30%" />
  <img src="https://github.com/user-attachments/assets/89134a42-1b5c-47b1-b0f6-043d3898c21f" alt="MyGymPal Screenshot 6" width="30%" />
</div>

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) - UI library
- **Build Tool:** [Vite](https://vitejs.dev/) - Fast build tool and dev server
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Backend:** [Supabase](https://supabase.com/) - Database, auth, and storage
- **Data Fetching:** [TanStack Query](https://tanstack.com/query) - Server state management
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) built on [Radix UI](https://www.radix-ui.com/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation
- **Routing:** [React Router](https://reactrouter.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox
- **Testing:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **Package Manager:** npm / pnpm

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, pnpm, or yarn
- A [Supabase](https://supabase.com/) project (URL + anon key)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/my-gym-pal.git
   cd my-gym-pal
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:5173](http://localhost:5173) to see the application.

## 🧪 Testing

Run the test suite:

```bash
npm test
# or watch mode
npm run test:watch
```

## 🧹 Linting & Formatting

```bash
npm run lint
npm run format        # write formatting fixes
npm run format:check  # check formatting only
```

## 📦 Build

```bash
npm run build          # production build
npm run build:dev      # development-mode build
npm run preview        # preview the production build locally
```

## 📁 Project Structure (high-level)

- `gym-types.ts` - Core type definitions (`WorkoutSet`, `MuscleGroup`, etc.)
- `gym-store.ts` - Repository-pattern data layer (fetch/mutate against Supabase)
- `components/` - `WorkoutLogger`, `PRDashboard`, `MuscleBalanceCard`, `LevelCard`, `WorkoutShareCard`, `AICoach`, and more
- `hooks/` - Custom hooks such as `useLastSession`, `useIsMobile`

## 📝 Development Notes

- **App Router-style navigation** via React Router nested routes
- **Repository pattern** in the data layer: fetch functions return data only, mutations throw and let components handle errors
- **Mobile-first UI** with adaptive `Stepper` / `RowStepper` components based on screen size
- Full **TypeScript** type safety across the codebase

## 🌐 Deployment

MyGymPal is a Vite-based PWA and can be deployed to any static hosting provider that supports SPA routing, such as [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), or [Cloudflare Pages](https://pages.cloudflare.com/).

Make sure to configure the same environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your hosting provider's dashboard.

## 📚 Learn More

- [React Documentation](https://react.dev/) - Learn about React
- [Vite Documentation](https://vitejs.dev/) - Learn about Vite
- [Supabase Documentation](https://supabase.com/docs) - Learn about Supabase
- [TanStack Query Documentation](https://tanstack.com/query/latest) - Learn about data fetching
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/docs) - Component library docs

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Author

**Leonaldo Pasaribu**

- GitHub: [@leonaldopasaribu](https://github.com/leonaldopasaribu)
- LinkedIn: [Leonaldo Pasaribu](https://linkedin.com/in/leonaldo-pasaribu)


<div align="center">
  Made with 💪 using React, TypeScript & Supabase
</div>
