# Next.js Notes (Learning + Interview Prep)

> Started from my own class notes (section 1), cleaned up and extended with setup, routing, rendering, data fetching, SEO, deployment and interview questions. I already know React, so this focuses on **what Next.js adds**.

---

## Table of Contents

1. [My original notes, cleaned up](#1-my-original-notes-cleaned-up)
2. [Setting up the development environment](#2-setting-up-the-development-environment)
3. [Project structure (App Router)](#3-project-structure-app-router)
4. [Routing](#4-routing)
5. [Server Components vs Client Components](#5-server-components-vs-client-components)
6. [Rendering strategies: CSR, SSR, SSG, ISR](#6-rendering-strategies-csr-ssr-ssg-isr)
7. [Data fetching and mutations](#7-data-fetching-and-mutations)
8. [Backend inside Next.js (Route Handlers)](#8-backend-inside-nextjs-route-handlers)
9. [SEO, images and fonts](#9-seo-images-and-fonts)
10. [Special files: loading, error, not-found, layouts](#10-special-files-loading-error-not-found-layouts)
11. [Middleware / Proxy and authentication](#11-middleware--proxy-and-authentication)
12. [Using Ant Design, Zustand and React Query with Next.js](#12-using-ant-design-zustand-and-react-query-with-nextjs)
13. [App Router vs Pages Router](#13-app-router-vs-pages-router)
14. [React (Vite) vs Next.js](#14-react-vite-vs-nextjs)
15. [Deployment](#15-deployment)
16. [Interview questions with short answers](#16-interview-questions-with-short-answers)
17. [Practice tasks and 2-week plan](#17-practice-tasks-and-2-week-plan)

---

## 1. My original notes, cleaned up

**What is Next.js?**
Next.js is a powerful framework for building **fast and search-engine-friendly** applications. It is built on top of React and is a comprehensive (batteries-included) framework.

**What it gives me out of the box**

- **Built on React:** I still write components, hooks and JSX.
- **Own routing system:** file-based routing, so no separate library like React Router is needed.
- **Compiler:** transforms and minifies JavaScript/TypeScript code (Next.js uses a Rust-based compiler called SWC, and a Rust bundler called Turbopack in recent versions).
- **CLI (Command Line Interface):** commands to develop, build and start the app (`next dev`, `next build`, `next start`).
- **Node.js runtime:** Next.js runs on Node.js on the server side.
- **Static site generation (SSG)** and other rendering modes (SSR, ISR) for speed and SEO.

**Two places JavaScript can run**

1. In the **web browser** (client side).
2. In **Node.js** (server side).

Next.js comes from the Node.js runtime, so I can do **full-stack development** in one project: the backend code is executed on Node, and the frontend code is bundled and executed in the browser.

**Why "search-engine friendly"?**
With a plain React SPA, the server sends an almost empty HTML file and the browser builds the page with JavaScript. Crawlers and social-media previews may see little content. With Next.js, the server (or the build step) can send **ready-made HTML**, so content is visible immediately, which helps SEO and first load speed.

---

## 2. Setting up the development environment

### Requirements

| Item                  | Requirement                                                  |
| --------------------- | ------------------------------------------------------------ |
| **Node.js**           | **20.9 or newer** for current Next.js (version 16).          |
| Package manager       | npm, pnpm, yarn or bun                                       |
| Editor                | VS Code (with ESLint, Prettier, Tailwind extensions if used) |
| Browser               | Any modern browser                                           |
| TypeScript (optional) | 5.1 or newer                                                 |

> **Correction to my old note:** "Node 16/18+" was right for **older** Next.js versions (Next 13 needed 16.14, Next 14/15 needed 18.x). The current Next.js documentation lists **Node 20.9** as the minimum. Always check the "System requirements" on nextjs.org for the version you use, and use an LTS version of Node.

Check versions:

```bash
node -v
npm -v
```

Use **nvm** (Node Version Manager) to switch Node versions between projects:

```bash
nvm install 20
nvm use 20
```

### Create a project

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev      # http://localhost:3000
```

The installer asks about TypeScript, linting, Tailwind CSS, the `src/` folder, App Router and import alias. Choosing the recommended defaults is fine for learning.

### Scripts in package.json

| Script  | Command      | Purpose                                 |
| ------- | ------------ | --------------------------------------- |
| `dev`   | `next dev`   | Development server with hot reload      |
| `build` | `next build` | Create optimized production build       |
| `start` | `next start` | Run the production server (after build) |

Note: in newer versions `next build` no longer runs the linter automatically, so run lint separately in CI.

---

## 3. Project structure (App Router)

```
my-app/
  app/
    layout.tsx          # root layout (required): <html>, <body>, shared UI
    page.tsx            # route "/"
    globals.css
    about/
      page.tsx          # route "/about"
    orders/
      page.tsx          # route "/orders"
      [id]/
        page.tsx        # route "/orders/123" (dynamic)
    api/
      health/
        route.ts        # backend endpoint: GET /api/health
  components/
  lib/                  # helpers, db, api clients
  public/               # static files served from "/" (images, favicon)
  next.config.ts        # Next.js configuration
  package.json
  tsconfig.json
```

Key idea: **folders define URL segments**, and a special file name defines what that segment does (`page`, `layout`, `route`, `loading`, `error`).

Minimal root layout and page:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// app/page.tsx
export default function Home() {
  return <h1>Hello, Next.js!</h1>;
}
```

---

## 4. Routing

### 4.1 File-system routing (no React Router needed)

| File                               | URL                                                    |
| ---------------------------------- | ------------------------------------------------------ |
| `app/page.tsx`                     | `/`                                                    |
| `app/about/page.tsx`               | `/about`                                               |
| `app/orders/[id]/page.tsx`         | `/orders/42`                                           |
| `app/blog/[...slug]/page.tsx`      | `/blog/a`, `/blog/a/b/c` (catch-all)                   |
| `app/shop/[[...slug]]/page.tsx`    | `/shop` and nested (optional catch-all)                |
| `app/(marketing)/pricing/page.tsx` | `/pricing` (parentheses = **route group**, not in URL) |

### 4.2 Dynamic route

```tsx
// app/orders/[id]/page.tsx
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // in recent versions params is a Promise
  const order = await getOrder(id);
  return <h1>Order {order.number}</h1>;
}
```

### 4.3 Navigation

```tsx
import Link from "next/link";
<Link href="/orders/42">View order</Link>; // client-side navigation + prefetch

("use client");
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";

const router = useRouter();
router.push("/orders"); // navigate
router.replace("/login"); // navigate without adding history entry
router.refresh(); // re-fetch server data for current route
router.back();
const pathname = usePathname(); // "/orders/42"
const search = useSearchParams(); // ?status=open
```

**Important:** in the App Router, import hooks from `next/navigation`, **not** `next/router` (that one is for the Pages Router).

### 4.4 Comparison with React Router

| React Router                          | Next.js                                                      |
| ------------------------------------- | ------------------------------------------------------------ |
| `<Routes>` / `<Route>` config in code | Folder and file structure                                    |
| `useNavigate`                         | `useRouter().push`                                           |
| `useParams`                           | `params` prop (server) / `useParams` (client)                |
| `useLocation`                         | `usePathname` + `useSearchParams`                            |
| `<Outlet />`                          | `layout.tsx` with `children`                                 |
| `Link`                                | `next/link` `Link`                                           |
| Hash links (`HashLink`)               | `<Link href="/page#section">` handles hash scroll by default |

### 4.5 Nested layouts

A `layout.tsx` wraps all pages below it and **does not re-render or lose state** when navigating between its children. Good for dashboard sidebars.

---

## 5. Server Components vs Client Components

In the App Router, components are **Server Components by default**.

|                                                 | Server Component (default)             | Client Component (`'use client'`)                             |
| ----------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Runs on                                         | Server (Node) only                     | Server (pre-render) and browser                               |
| JS sent to browser                              | None for the component                 | Yes                                                           |
| Can use `useState`, `useEffect`, event handlers | **No**                                 | Yes                                                           |
| Can access DB, file system, secrets directly    | **Yes**                                | No                                                            |
| Can be `async` and `await` data                 | Yes                                    | No                                                            |
| Use for                                         | Data fetching, static content, layouts | Interactivity: forms, modals, charts, antd components, stores |

```tsx
// app/orders/page.tsx  (Server Component, no directive needed)
export default async function Orders() {
  const orders = await db.order.findMany();       // direct DB access, safe
  return <OrderTable orders={orders} />;          // pass data as props
}

// components/OrderTable.tsx
'use client';
import { useState } from 'react';
export function OrderTable({ orders }) {
  const [selected, setSelected] = useState(null);   // interactivity needs client
  ...
}
```

**Rules of thumb**

- Keep `'use client'` as **low in the tree** as possible so more code stays on the server.
- A Server Component can import a Client Component. A Client Component can't import a Server Component, but it can receive one as `children` props.
- Props passed from server to client must be **serializable** (no functions, class instances).
- Never import server-only secrets into client files. Use `server-only` package to enforce.

---

## 6. Rendering strategies: CSR, SSR, SSG, ISR

| Strategy                                  | When HTML is created                                                        | Good for                                       | Trade-off                      |
| ----------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------ |
| **CSR** (client-side rendering)           | In the browser after JS loads                                               | Dashboards, behind-login pages                 | Slower first paint, weak SEO   |
| **SSR** (server-side rendering)           | On the server **for every request**                                         | Personalized or frequently changing pages, SEO | More server work per request   |
| **SSG** (static site generation)          | **At build time**                                                           | Blogs, docs, landing and marketing pages       | Content is stale until rebuild |
| **ISR** (incremental static regeneration) | At build time, then regenerated in the background after a time or on demand | Product catalogs, news                         | Slightly stale data window     |

### How this appears in the App Router

- A page with no dynamic data (no cookies, headers, or uncached fetches) can be **prerendered statically** at build time.
- Using request-specific APIs (`cookies()`, `headers()`, `searchParams`) or uncached data makes a route **dynamic** (rendered per request).
- `generateStaticParams` pre-builds dynamic routes (for example all blog slugs):

```tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
```

- Time-based revalidation: `fetch(url, { next: { revalidate: 60 } })` or `export const revalidate = 60`.
- On-demand revalidation: `revalidatePath('/orders')` / `revalidateTag('orders')` after a mutation.

> Caching behavior has changed between Next.js 13, 14, 15 and 16. Read the **Caching** / **Cache Components** docs for the version in your project before relying on defaults.

### Streaming

With `loading.tsx` and `<Suspense>`, Next.js sends the page shell first and **streams** slower parts as they become ready, so users see something quickly.

---

## 7. Data fetching and mutations

### 7.1 Fetch in Server Components

```tsx
export default async function Page() {
  const res = await fetch("https://api.example.com/products");
  if (!res.ok) throw new Error("Failed to load"); // handled by error.tsx
  const products = await res.json();
  return <ProductList products={products} />;
}
```

- No `useEffect` + `useState` needed for the initial data.
- Fetch **in parallel** with `Promise.all` to avoid waterfalls (sequential awaits).
- Client-side fetching (React Query / SWR) is still used for live or user-triggered data inside Client Components.

### 7.2 Server Actions (mutations without writing an API route)

```tsx
// app/orders/actions.ts
"use server";
import { revalidatePath } from "next/cache";

export async function createOrder(formData: FormData) {
  const customer = formData.get("customer") as string;
  await db.order.create({ data: { customer } });
  revalidatePath("/orders"); // refresh the list
}

// app/orders/new/page.tsx
import { createOrder } from "../actions";
export default function NewOrder() {
  return (
    <form action={createOrder}>
      <input name="customer" />
      <button type="submit">Save</button>
    </form>
  );
}
```

Security: a Server Action is a **public HTTP endpoint**. Always validate input (Zod) and check authentication/authorization inside it.

### 7.3 Older Pages Router methods (still asked in interviews)

| Method               | Meaning                           |
| -------------------- | --------------------------------- |
| `getStaticProps`     | Fetch data at build time (SSG)    |
| `getStaticPaths`     | Which dynamic paths to pre-build  |
| `getServerSideProps` | Fetch data on every request (SSR) |
| `getInitialProps`    | Legacy, avoid                     |

---

## 8. Backend inside Next.js (Route Handlers)

Because Next.js runs on Node.js, I can write backend endpoints in the same project (full stack).

```ts
// app/api/orders/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const orders = await db.order.findMany({ where: { status } });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  // validate body here (Zod)
  const created = await db.order.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
```

```ts
// app/api/orders/[id]/route.ts
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  ...
}
```

| Question                            | Answer                                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend runs where?                 | On the server (Node.js runtime, or Edge runtime if chosen)                                                                                                        |
| Frontend runs where?                | Bundled by Next.js and executed in the browser (plus server pre-render)                                                                                           |
| Should I put everything in Next.js? | Fine for small/medium apps and BFF (backend-for-frontend). For a big ERP with an existing backend, Next.js often acts as the UI layer and calls the existing API. |
| Environment variables               | `.env.local`. Only names starting with `NEXT_PUBLIC_` are exposed to the browser. Everything else stays on the server.                                            |

---

## 9. SEO, images and fonts

### Metadata API

```tsx
// static
export const metadata = {
  title: "Orders | My ERP",
  description: "Manage customer orders",
  openGraph: { title: "Orders", images: ["/og.png"] },
};

// dynamic
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product.name, description: product.summary };
}
```

Also: `app/sitemap.ts`, `app/robots.ts`, canonical URLs, structured data (JSON-LD).

### next/image

```tsx
import Image from "next/image";
<Image
  src="/hero.png"
  alt="Dashboard preview"
  width={800}
  height={400}
  priority
/>;
```

Automatic resizing, modern formats (WebP/AVIF), lazy loading, and prevents layout shift (CLS). Use `priority` for above-the-fold (LCP) images. Remote images need allowed domains configured.

### next/font

Self-hosts fonts and removes layout shift:

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
// <body className={inter.className}>
```

### Other built-ins

`next/script` (control third-party scripts), `next/link` prefetching, automatic code splitting per route, CSS Modules and Tailwind support.

---

## 10. Special files: loading, error, not-found, layouts

| File               | Purpose                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `layout.tsx`       | Shared UI wrapper that persists across navigation                                               |
| `page.tsx`         | Unique UI for a route (makes it publicly accessible)                                            |
| `template.tsx`     | Like layout but remounts on every navigation                                                    |
| `loading.tsx`      | Instant loading UI (wraps the page in Suspense)                                                 |
| `error.tsx`        | Error boundary for the segment. **Must be a Client Component** and receives `error` and `reset` |
| `global-error.tsx` | Catches errors in the root layout                                                               |
| `not-found.tsx`    | UI for 404 (`notFound()` function triggers it)                                                  |
| `route.ts`         | API endpoint (cannot coexist with `page.tsx` at same segment)                                   |

```tsx
// app/orders/error.tsx
"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <p>Something went wrong.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## 11. Middleware / Proxy and authentication

- Code that runs **before a request is completed**, for redirects, auth checks, headers, A/B tests, locale detection.
- Historically the file is `middleware.ts` at the project root, using a `matcher` to choose paths. In Next.js 16 this concept is being renamed to **`proxy`** (`proxy.ts`). Check the docs for your version.
- Use it for **lightweight checks** (is there a session cookie? redirect to `/login`). Do **real authorization** close to the data (in Server Components, Server Actions, route handlers) because the middleware/proxy layer can be bypassed or misconfigured.

```ts
// middleware.ts (or proxy.ts in newer versions; check naming for your version)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("session");
  if (!hasSession && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
```

Auth libraries to know: **Auth.js (NextAuth)**, Clerk, Auth0, or a custom JWT/session with httpOnly cookies.

---

## 12. Using Ant Design, Zustand and React Query with Next.js

### Ant Design

- Antd components use hooks and context, so they work as **Client Components**. Wrap usage in files that start with `'use client'`.
- To avoid style flashing during SSR, use the official antd Next.js integration (`@ant-design/nextjs-registry`) in the root layout. Check the antd docs for the setup that matches your antd and Next versions.

### Zustand

- Works in Client Components only (uses hooks).
- On the server, a module-level global store would be **shared between requests** (data leak risk). For SSR with per-user data, create the store per request/provider as shown in the Zustand Next.js guide. For pure client-side UI state this is rarely an issue.

### React Query

- Great in Client Components for live data. Can prefetch on the server and **hydrate** (`HydrationBoundary`) so the client doesn't refetch immediately.
- Many apps simply fetch initial data in Server Components and use React Query for interactive parts.

### Common errors

| Error                                                                                     | Cause / fix                                                                                                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "You're importing a component that needs `useState`. It only works in a Client Component" | Add `'use client'` at the top of the file                                                                                                                                |
| "Hydration failed" / text mismatch                                                        | Server HTML differs from client render. Avoid `Date.now()`, `Math.random()`, `window`/`localStorage` checks during first render. Use `useEffect` for browser-only values |
| `window is not defined`                                                                   | Code ran on the server. Guard with `typeof window !== 'undefined'` or move into `useEffect` / client-only component (`dynamic(() => import(...), { ssr: false })`)       |
| Env variable undefined in browser                                                         | Missing `NEXT_PUBLIC_` prefix, or dev server not restarted                                                                                                               |

---

## 13. App Router vs Pages Router

|                  | **App Router** (`app/`)                     | **Pages Router** (`pages/`)                |
| ---------------- | ------------------------------------------- | ------------------------------------------ |
| Introduced       | Next.js 13                                  | Original                                   |
| Components       | Server Components by default                | All client components (with SSR)           |
| Data fetching    | `async` components, `fetch`, Server Actions | `getStaticProps`, `getServerSideProps`     |
| Layouts          | Nested `layout.tsx`                         | `_app.tsx`, `_document.tsx`                |
| API              | `route.ts` Route Handlers                   | `pages/api/*.ts`                           |
| Navigation hooks | `next/navigation`                           | `next/router`                              |
| Status           | Recommended for new projects                | Still supported; many existing apps use it |

Be able to read and explain both, because company projects may use either.

---

## 14. React (Vite) vs Next.js

|                                | React + Vite (SPA)                    | Next.js                                                             |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------- |
| Type                           | Library + build tool                  | Full framework                                                      |
| Routing                        | Add React Router                      | Built in (file based)                                               |
| Rendering                      | CSR only (unless you add more)        | CSR, SSR, SSG, ISR, streaming                                       |
| SEO                            | Weak by default                       | Strong                                                              |
| Backend/API                    | Separate server needed                | Route Handlers / Server Actions                                     |
| Image/font/script optimization | Manual                                | Built in                                                            |
| Hosting                        | Any static host                       | Node server or serverless platform (static export possible)         |
| Learning curve                 | Lower                                 | Higher (server/client boundary, caching)                            |
| Best for                       | Internal dashboards, ERP behind login | Public sites, e-commerce, content, SEO-driven apps, full-stack apps |

---

## 15. Deployment

| Option            | Notes                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**        | Made by the Next.js team; easiest. Git push gives a preview URL and a production deploy.                                                          |
| **Node server**   | `next build` then `next start` (needs Node on the server; use PM2 or a process manager, Nginx as reverse proxy).                                  |
| **Docker**        | `output: 'standalone'` in `next.config` produces a minimal server bundle; multi-stage Dockerfile.                                                 |
| **Static export** | `output: 'export'` creates plain HTML/CSS/JS in `out/` for any static host. No server features (SSR, Route Handlers, Server Actions, middleware). |
| Other platforms   | Netlify, AWS (Amplify, ECS), Azure, Cloudflare via adapters                                                                                       |

Checklist: set production env variables, `next build` passes, images domains configured, error monitoring (Sentry), CI runs lint, type check and tests.

---

## 16. Interview questions with short answers

1. **What is Next.js?** A React framework for building full-stack web apps with built-in routing, multiple rendering modes (SSR, SSG, ISR, CSR), API/backend support, and performance optimizations.
2. **Why use Next.js over plain React?** SEO and faster first load (server-rendered HTML), built-in routing, image/font optimization, code splitting, and the ability to write backend code in the same project.
3. **Do I need React Router in Next.js?** No. Routing is file-system based.
4. **What is the difference between SSR and SSG?** SSG builds HTML once at build time (fast, cacheable). SSR builds HTML on every request (fresh, personalized).
5. **What is ISR?** Static pages that are regenerated in the background after a set time or on demand, so you get static speed with reasonably fresh data.
6. **What are Server Components?** Components rendered only on the server; they send no component JS to the browser and can access backend resources directly. They are the default in the App Router.
7. **When do I need `'use client'`?** When using state, effects, event handlers, browser APIs, or client-only libraries (like most UI-kit components).
8. **Can a Server Component import a Client Component?** Yes. The reverse is not allowed directly, but a Client Component can receive Server Components as `children`.
9. **What is hydration?** React attaching event handlers and state to HTML that the server already rendered. A mismatch between server and client output causes hydration errors.
10. **What is `getServerSideProps`?** Pages Router function that runs on the server on every request to fetch data before rendering.
11. **How do you create dynamic routes?** Folders with brackets: `[id]`, `[...slug]`, `[[...slug]]`.
12. **How do you handle SEO?** Metadata API (`metadata` / `generateMetadata`), sitemap, robots, semantic HTML, `next/image`, fast Core Web Vitals, server-rendered content.
13. **What is `next/image` and why use it?** An optimized image component: resizing, modern formats, lazy loading, prevents layout shift.
14. **What are Route Handlers?** `route.ts` files that define API endpoints (GET, POST...) inside the `app` directory.
15. **What are Server Actions?** Async functions marked `'use server'` that run on the server and can be called from forms or client code, replacing many simple API routes. They must validate input and check auth.
16. **How do you protect routes?** Middleware/proxy for fast redirects, plus real checks in Server Components, Actions and Route Handlers; use httpOnly session cookies.
17. **How do you expose env variables to the browser?** Prefix with `NEXT_PUBLIC_`. Others stay server only.
18. **How do you fetch data in the App Router?** `async` Server Components with `fetch` or direct DB calls; parallelize with `Promise.all`; use React Query/SWR in client components when needed.
19. **What is streaming and Suspense in Next.js?** Sending parts of the page as they're ready, with `loading.tsx` / `<Suspense>` fallbacks, to improve perceived performance.
20. **How is the Next.js code split?** Automatically per route; plus `next/dynamic` / `React.lazy` for heavy components.
21. **What does `next build` do?** Compiles and optimizes the app for production: bundles, minifies, prerenders static routes, outputs `.next`.
22. **When would you NOT choose Next.js?** A small internal tool behind login with an existing backend and no SEO need, where a Vite SPA is simpler and cheaper to host.
23. **How is Next.js full stack?** It runs on Node.js. Server code (Route Handlers, Server Actions, Server Components) executes on the server; client code is bundled and runs in the browser.
24. **What is the Edge runtime?** A lightweight runtime that runs closer to users, with limited Node APIs, used for middleware or fast responses.
25. **How do you handle errors?** `error.tsx` per segment (Client Component with `reset`), `global-error.tsx`, `not-found.tsx` with `notFound()`, plus monitoring like Sentry.

---

## 17. Practice tasks and 2-week plan

### Practice tasks (build from scratch)

1. Create a project with `create-next-app`, add pages `/`, `/about` and a shared navbar in `layout.tsx`.
2. Blog: list page (SSG) and `/blog/[slug]` page with `generateStaticParams` and `generateMetadata`.
3. Products page that fetches from a public API in a Server Component, with `loading.tsx` and `error.tsx`.
4. Route Handler `/api/todos` (GET, POST) with in-memory data; call it from a Client Component.
5. Form with a Server Action that validates with Zod and calls `revalidatePath`.
6. Protected `/dashboard` with login (cookie session) and redirect using middleware/proxy.
7. Add `next/image`, `next/font`, and OpenGraph metadata; run Lighthouse.
8. Add antd and a client-side Zustand store (cart or filters).
9. Deploy to Vercel, then build a Docker image with `output: 'standalone'`.

### 2-week plan

| Day | Focus                                                                    |
| --- | ------------------------------------------------------------------------ |
| 1-2 | Setup, structure, routing, layouts, `Link`                               |
| 3-4 | Server vs Client Components, `'use client'` boundaries                   |
| 5-6 | Data fetching, `loading`/`error`, streaming                              |
| 7   | Rendering modes: SSG, SSR, ISR, revalidation (revise and build the blog) |
| 8-9 | Route Handlers, Server Actions, validation                               |
| 10  | SEO: metadata, sitemap, images, fonts                                    |
| 11  | Auth and middleware/proxy                                                |
| 12  | Antd, Zustand and React Query with Next.js                               |
| 13  | Deployment (Vercel, Docker)                                              |
| 14  | Mock interview with section 16, fix weak areas                           |

### Resources

- Official docs and the "Learn Next.js" course: nextjs.org/docs
- React docs on Server Components: react.dev
- Always confirm version-specific behavior (caching, middleware/proxy naming, async `params`) in the docs for your Next.js version.

---

_Last updated: October 2026_
