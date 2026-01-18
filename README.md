# SoundGravity

**SoundGravity** is an interactive web platform designed for musicians to share their work with immersive audio-visual experiences. It features a relative coordinate-based audio engine and responsive visual effects.

**SoundGravity**는 뮤지션이 몰입형 시청각 경험과 함께 작품을 공유할 수 있도록 설계된 인터랙티브 웹 플랫폼입니다. 상대 좌표 기반 오디오 엔진과 반응형 시각 효과를 특징으로 합니다.

---

## Features (기능)

- **Admin Dashboard**: Secure login, project management, and file uploads (Image/Audio).
- **Interactive Viewer**:
    - **Relative Coordinate Audio**: Panning (X-axis) and Filter (Y-axis) mapped to touch/mouse position.
    - **Visual Effects**: Glitch and scaling effects on interaction.
    - **Responsive Design**: Optimized for both desktop and mobile.
- **Optimization**: SEO-ready with dynamic Open Graph tags, WebP image optimization, and safe-area support.

## Tech Stack (기술 스택)

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel

## Getting Started (시작하기)

### Prerequisites (사전 준비)

- Node.js 18+
- Supabase Account

### Installation (설치)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/sound-gravity.git
   cd sound-gravity
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup (.env.local)**:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**:
   Run the SQL found in `supabase/schema.sql` in your Supabase SQL Editor to create tables and storage policies.

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Deployment (배포)

This project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy!

## Usage (사용법)

1. **Admin Login**: Go to `/login` to access the dashboard.
2. **Create Project**: Upload an image and an audio file.
3. **Preview**: Click on a project in the list to see the preview.
4. **Share**: Copy the link (or click the Share button on mobile) to share your interactive page (`/v/[id]`).

---

## License

MIT
