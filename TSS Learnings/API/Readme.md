# React in Production: Advanced Prep Notes

> Companion to my main React interview notes. The first guide covers fundamentals. This one covers what separates a developer who _knows React_ from one who can _ship and maintain React apps in production_. At 1 to 3 years of experience, interviewers increasingly ask "how would you handle this in a real app?"

---

## Table of Contents

1. [Suggested topics to learn next (priority order)](#1-suggested-topics-to-learn-next-priority-order)
2. [Project structure and architecture](#2-project-structure-and-architecture)
3. [TypeScript with React](#3-typescript-with-react)
4. [Server state with React Query (TanStack Query)](#4-server-state-with-react-query-tanstack-query)
5. [Error handling and monitoring](#5-error-handling-and-monitoring)
6. [Authentication, authorization and security](#6-authentication-authorization-and-security)
7. [Performance in production](#7-performance-in-production)
8. [Testing](#8-testing)
9. [Build, deploy and CI/CD](#9-build-deploy-and-cicd)
10. [Large forms and tables (ERP specific)](#10-large-forms-and-tables-erp-specific)
11. [Accessibility and internationalization](#11-accessibility-and-internationalization)
12. [Modern React features (18 and 19)](#12-modern-react-features-18-and-19)
13. [Rendering strategies: CSR, SSR, SSG, Next.js basics](#13-rendering-strategies-csr-ssr-ssg-nextjs-basics)
14. [Code quality and team workflow](#14-code-quality-and-team-workflow)
15. [Debugging production issues](#15-debugging-production-issues)
16. [Pre-release checklist](#16-pre-release-checklist)
17. [Production scenario interview questions](#17-production-scenario-interview-questions)
18. [8-week plan](#18-8-week-plan)

---

## 1. Suggested topics to learn next (priority order)

| Priority | Topic                                                                   | Why it matters                                                                           |
| -------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1        | **TypeScript**                                                          | Most job postings require it. Catches bugs before runtime.                               |
| 2        | **React Query (TanStack Query)**                                        | Replaces hand-written `useEffect` + `useState` fetching. Caching, retries, revalidation. |
| 3        | **Testing** (Vitest, React Testing Library)                             | Shows maturity. Many candidates have none.                                               |
| 4        | **Error handling and monitoring** (Error Boundary, Sentry)              | Production apps fail. You need to know when and why.                                     |
| 5        | **Auth and security basics** (JWT, XSS, CSRF, RBAC)                     | ERP apps handle sensitive business data.                                                 |
| 6        | **Performance profiling** (React Profiler, Lighthouse, bundle analysis) | Turns "I used useMemo" into "I measured and fixed X".                                    |
| 7        | **Git workflow and CI/CD**                                              | Real teams ship through pipelines.                                                       |
| 8        | **Next.js basics** (SSR, routing, data fetching)                        | Common next step in the React ecosystem.                                                 |
| 9        | **Accessibility and i18n**                                              | Enterprise and government clients require them.                                          |
| 10       | **System design for frontend**                                          | Senior-level interviews: how would you design a dashboard, or an editable data grid?     |

Extra topics worth knowing by name: monorepos (pnpm workspaces, Turborepo, Nx), micro-frontends, feature flags, Storybook, design systems, WebSockets / Server-Sent Events for live data, PWA basics, React Hook Form with Zod, Playwright / Cypress for end-to-end tests.

---

## 2. Project structure and architecture

### Feature-based folder structure (scales better than "all components in one folder")

```
src/
  app/                 # app setup: providers, router, global styles
  features/
    orders/
      api/             # API calls for this feature
      components/      # components used only here
      hooks/           # useOrders, useOrderForm
      pages/           # route-level components
      store/           # Zustand slice (if needed)
      types.ts
      index.ts         # public exports of the feature
    customers/
    inventory/
  shared/
    components/        # Button wrappers, DataTable, PageHeader
    hooks/             # useDebounce, usePermission
    utils/             # formatDate, formatCurrency
    api/               # axios instance, interceptors
  assets/
```

### Principles to explain in interviews

- **Separation of concerns:** UI components display; hooks hold logic; an API layer talks to the server.
- **Single responsibility:** one component, one job. If a file passes about 300 lines, look for things to extract.
- **Container vs presentational:** smart components fetch data; dumb components only render props.
- **Colocation:** keep code close to where it's used. Move to `shared/` only when two or more features need it.
- **Absolute imports** (`@/shared/...`) instead of `../../../../`.
- **Environment config:** `.env.development`, `.env.production`. In Vite, only variables prefixed `VITE_` are exposed to the browser. **Never put secrets in frontend env files.** They end up in the bundle.
- **API layer:** one place for base URL, auth headers, error handling. Components never call `axios` directly.

---

## 3. TypeScript with React

### Why

Autocomplete, safer refactors, self-documenting props, fewer runtime errors (`undefined is not a function`).

### Essentials

```tsx
// Props typing
interface OrderCardProps {
  order: Order;
  onSelect?: (id: string) => void;   // optional callback
  children?: React.ReactNode;
}

function OrderCard({ order, onSelect }: OrderCardProps) { ... }

// Models
type Status = 'draft' | 'approved' | 'rejected';   // union type

interface Order {
  id: string;
  total: number;
  status: Status;
  customer?: { name: string };   // optional
}

// Hooks
const [orders, setOrders] = useState<Order[]>([]);
const [selected, setSelected] = useState<Order | null>(null);
const inputRef = useRef<HTMLInputElement>(null);

// Events
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);

// Generic API helper
async function get<T>(url: string): Promise<T> {
  const res = await api.get<T>(url);
  return res.data;
}
```

### Concepts to learn

| Concept                 | One-liner                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `interface` vs `type`   | Both describe shapes. `interface` can be extended/merged; `type` supports unions and mapped types. Pick one convention. |
| Union and literal types | `'a' \| 'b'`: restrict values.                                                                                          |
| Generics                | Reusable typed code: `Array<T>`, `useState<T>`.                                                                         |
| Utility types           | `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, `ReturnType<typeof fn>`                                       |
| `unknown` vs `any`      | `any` disables checks. `unknown` forces you to narrow first. Avoid `any`.                                               |
| Type narrowing          | `typeof`, `in`, discriminated unions                                                                                    |
| `as` assertions         | Tells compiler "trust me". Overuse hides bugs.                                                                          |
| `strict` mode           | Turn on in `tsconfig.json` from day one.                                                                                |

**Zod** (runtime validation) pairs well: validate API responses and form data, then infer the TypeScript type from the schema with `z.infer`.

---

## 4. Server state with React Query (TanStack Query)

### Client state vs server state

- **Client state:** belongs to the UI (modal open, selected tab). Use `useState` / Zustand.
- **Server state:** data owned by the backend that can become stale (orders, users). It needs caching, refetching, deduplication, loading and error states. Use React Query or SWR.

### Basic usage

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function OrderList({ page }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", page], // cache key: changes refetch
    queryFn: () => api.get("/orders", { params: { page } }).then((r) => r.data),
    staleTime: 60_000, // fresh for 1 minute
    placeholderData: (prev) => prev, // keep old page while loading new (v5)
  });

  if (isLoading) return <Spin />;
  if (isError) return <Alert type="error" message={error.message} />;
  return <Table dataSource={data.items} />;
}

function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/orders/${id}`),
    onSuccess: () => {
      message.success("Deleted");
      qc.invalidateQueries({ queryKey: ["orders"] }); // revalidate list
    },
    onError: () => message.error("Delete failed"),
  });
}
```

### Concepts

| Concept                         | Meaning                                                                     |
| ------------------------------- | --------------------------------------------------------------------------- |
| `queryKey`                      | Unique cache identity. Include every variable the query depends on.         |
| `staleTime`                     | How long data counts as fresh (no refetch).                                 |
| `gcTime` (formerly `cacheTime`) | How long unused data stays in cache.                                        |
| Invalidation                    | Mark data stale after a mutation so it refetches. This is **revalidation**. |
| Optimistic update               | Update UI immediately, roll back on error.                                  |
| Retry                           | Automatic retries with backoff on failure.                                  |
| Dependent queries               | `enabled: !!userId` waits until the value exists.                           |
| Prefetching                     | Load data before the user navigates.                                        |
| Pagination / infinite           | `useInfiniteQuery` for "load more" and infinite scroll.                     |

---

## 5. Error handling and monitoring

### Layers of error handling

1. **Field level:** form validation messages.
2. **Request level:** `try/catch`, React Query `onError`, Axios interceptors. Show a toast or inline message.
3. **Component level:** Error Boundary catches render errors so one broken widget doesn't blank the whole page.
4. **Global level:** `window.onerror` and `unhandledrejection` listeners, sent to a monitoring tool.

### Error Boundary

```tsx
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary
  FallbackComponent={({ error, resetErrorBoundary }) => (
    <Result
      status="error"
      title="Something went wrong"
      extra={<Button onClick={resetErrorBoundary}>Try again</Button>}
    />
  )}
  onError={(error, info) => reportToSentry(error, info)}
>
  <Dashboard />
</ErrorBoundary>;
```

Error boundaries do **not** catch: event handler errors, async code, SSR errors, errors in the boundary itself.

### Monitoring (know the idea, even if you haven't used it)

- **Sentry** (or similar): captures exceptions with stack trace, browser, user, breadcrumbs. Upload **source maps** so stack traces point to your real code, not minified bundles.
- **Logging:** never log passwords, tokens, or personal data. Remove `console.log` and `debugger` from production code (lint rule `no-console`, `no-debugger`).
- **User-friendly messages:** show "Could not save, please try again", log the technical detail separately.
- **Standard error shape** from the API (`{ code, message, fieldErrors }`) makes mapping server errors to form fields easy (`form.setFields`).

---

## 6. Authentication, authorization and security

### Authentication (who are you)

| Approach                                             | Notes                                               |
| ---------------------------------------------------- | --------------------------------------------------- |
| JWT in memory + refresh token in **httpOnly cookie** | Safer against XSS. Common recommended pattern.      |
| JWT in `localStorage`                                | Easy but any XSS can steal it. Know the trade-off.  |
| Session cookie (server-side session)                 | Browser sends automatically. Needs CSRF protection. |

**Token refresh flow:** access token expires (401) then an Axios response interceptor calls the refresh endpoint once, queues other failed requests, retries them with the new token. If refresh fails, log the user out.

### Authorization (what can you do), very important in ERP

- **RBAC (role-based access control):** roles like Admin, Manager, Clerk, each with permissions (`order:create`, `invoice:approve`).
- **Frontend checks are for UX only.** The server must enforce permissions. Hiding a button doesn't secure anything.

```tsx
// Permission hook and wrapper
function usePermission(code: string) {
  const perms = useAuthStore((s) => s.permissions);
  return perms.includes(code);
}

function Can({ permission, children }) {
  return usePermission(permission) ? <>{children}</> : null;
}

<Can permission="invoice:approve">
  <Button>Approve</Button>
</Can>;
```

Also protect routes (redirect to login or 403 page), and handle direct URL access.

### Common frontend security issues

| Threat                               | Prevention                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **XSS** (injected scripts)           | React escapes by default. Avoid `dangerouslySetInnerHTML`; if needed sanitize with DOMPurify. Validate `href` values (`javascript:` URLs). |
| **CSRF**                             | Use `SameSite` cookies and CSRF tokens when using cookie auth.                                                                             |
| **Sensitive data exposure**          | No secrets in frontend code or env files. Don't store sensitive data in localStorage.                                                      |
| **Vulnerable dependencies**          | `npm audit`, Dependabot / Renovate, lock files.                                                                                            |
| **Open redirects**                   | Validate redirect targets after login.                                                                                                     |
| **Clickjacking / content injection** | Security headers: CSP, `X-Frame-Options`, set by server/Nginx.                                                                             |
| **CORS**                             | A server setting, not a frontend fix. Understand why browsers block cross-origin requests.                                                 |

---

## 7. Performance in production

### Measure first

- **React DevTools Profiler:** which components re-render and why.
- **Chrome DevTools Performance and Network tabs:** long tasks, large requests.
- **Lighthouse:** overall audit.
- **Core Web Vitals:** **LCP** (loading, largest content painted), **INP** (responsiveness to interaction), **CLS** (layout shift).
- **Bundle analysis:** `rollup-plugin-visualizer` (Vite) or `webpack-bundle-analyzer`. Find huge libraries (moment.js, lodash full import, full icon packs).

### Fix list

| Problem                  | Fix                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Big initial bundle       | Route-level `React.lazy`, dynamic `import()` for heavy libs (charts, editors), tree-shaking, import only what you use |
| Slow tables / long lists | Virtualization, server-side pagination, memoized rows                                                                 |
| Too many re-renders      | Move state down, split components, `React.memo`, selector-based store (Zustand), stable props                         |
| Slow typing in inputs    | Debounce expensive work, `useDeferredValue` / `useTransition`, avoid heavy re-render per keystroke                    |
| Duplicate API calls      | React Query caching and deduplication                                                                                 |
| Large images             | Compress, correct sizes, `loading="lazy"`, WebP/AVIF                                                                  |
| Repeat visits slow       | Long-term caching with hashed filenames, CDN, gzip/brotli                                                             |
| Layout shift             | Set width/height for images and skeleton placeholders                                                                 |
| Memory leaks             | Clean up timers, listeners, subscriptions, requests in `useEffect` cleanup                                            |

### Memory leak example

```jsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize); // cleanup!
}, []);
```

---

## 8. Testing

### Test pyramid

| Level                   | Tool                          | What                                                    |
| ----------------------- | ----------------------------- | ------------------------------------------------------- |
| Unit                    | Vitest / Jest                 | Pure functions, utilities, reducers, custom hooks       |
| Component / integration | **React Testing Library**     | Render a component, interact like a user, assert output |
| API mocking             | **MSW** (Mock Service Worker) | Fake the server in tests without changing app code      |
| End-to-end              | Playwright / Cypress          | Full flows in a real browser (login, create order)      |

**Philosophy of React Testing Library:** test behavior the user sees, not implementation details. Query by role/label/text, not by class names or state.

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("shows error when email is empty", async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole("button", { name: /login/i }));
  expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
});
```

### Tips

- Start with the most valuable tests: critical flows (login, save order), complex utilities (price calculations, tax), and any bug you fixed (regression test).
- Don't chase 100% coverage; chase confidence.
- Run tests in CI on every pull request.

---

## 9. Build, deploy and CI/CD

### Build tools

- **Vite** (fast dev server, Rollup build) is the modern default. **Create React App is deprecated.** Webpack is still found in older ERP codebases.
- Production build: minified, tree-shaken, code-split, hashed filenames (`app.3f2a9c.js`) for cache busting.
- **Source maps:** useful for debugging; don't expose publicly if code is sensitive. Upload them to Sentry instead.

### Deployment basics

| Topic          | Key idea                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| Static hosting | Build output is plain files: serve with Nginx, S3 + CloudFront, Netlify, Vercel           |
| SPA fallback   | Server must return `index.html` for unknown paths so deep links work with `BrowserRouter` |
| Caching        | `index.html`: no-cache. Hashed JS/CSS: cache for a year (immutable)                       |
| Compression    | gzip or brotli                                                                            |
| Environments   | dev, staging (QA), production, each with its own API URL                                  |
| Rollback       | Keep previous builds so you can revert quickly                                            |
| Docker         | Multi-stage: build with Node, serve with Nginx                                            |

```nginx
# Nginx SPA fallback
location / {
  try_files $uri /index.html;
}
```

### CI/CD pipeline (what happens on a pull request)

1. Install dependencies (`npm ci`)
2. Lint (oxlint / ESLint) and type-check (`tsc --noEmit`)
3. Run tests
4. Build
5. Deploy preview (optional)
6. On merge to main: deploy to staging, then production after approval

Tools: GitHub Actions, GitLab CI, Jenkins.

### Handling a stale-tab problem

After a new deploy, users with the app open may request old hashed chunks that no longer exist, so lazy imports fail. Solutions: keep old assets for a while, catch chunk load errors and prompt "New version available, reload".

---

## 10. Large forms and tables (ERP specific)

### Forms

- **antd Form** (what I use): good for admin/ERP. Know `Form.List` (dynamic rows, for example order line items), `dependencies`, `Form.useWatch`, and `validateFields`.
- **React Hook Form + Zod:** popular outside antd. Uncontrolled inputs mean fewer re-renders. Know the idea: `register`, `handleSubmit`, `formState.errors`, `zodResolver`.
- **Unsaved changes warning:** warn before leaving (`beforeunload` event and router blocker).
- **Draft saving:** autosave long forms to the server or localStorage.
- **Prevent double submit:** disable button / `loading` state while saving; backend should also be idempotent.
- **Server validation errors:** map API field errors to `form.setFields`.

### Tables and grids

- **Server-side** pagination, sorting, filtering. Keep filter state in the URL (`useSearchParams`) so views are shareable and survive refresh.
- **Virtual scrolling** for thousands of rows. Consider AG Grid or TanStack Table for editable grids.
- **Column configuration:** memoize `columns`.
- **Export:** CSV/Excel through server endpoint (large data) or `xlsx` library (small).
- **Bulk actions, row selection across pages, inline edit**: practice these; they come up constantly in ERP.
- **Money and numbers:** never use floating point for currency math. Use integer minor units or a library (decimal.js / big.js). Format with `Intl.NumberFormat`.
- **Dates and time zones:** store UTC, display local. Use `dayjs` (antd default) or `date-fns`.

---

## 11. Accessibility and internationalization

### Accessibility (a11y)

- Use **semantic HTML** (`button`, `nav`, `main`, `label`) before reaching for ARIA.
- Every input needs a label. Images need `alt`.
- **Keyboard navigation:** everything usable by Tab/Enter/Escape; visible focus; focus trapping in modals (antd handles much of this).
- Color contrast at least 4.5:1 for normal text.
- Don't rely on color alone for status (add icon or text).
- Tools: Lighthouse, axe DevTools, `eslint-plugin-jsx-a11y`, screen reader test (NVDA, VoiceOver).

### Internationalization (i18n)

- Libraries: `react-i18next` or `react-intl`. Move all user-facing strings to translation files with keys.
- antd has `ConfigProvider locale={...}` for its built-in text.
- Format dates, numbers and currency with `Intl` APIs. Plan for text expansion and RTL if needed.

---

## 12. Modern React features (18 and 19)

| Feature                         | What it does                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Automatic batching** (18)     | State updates are batched everywhere (timeouts, promises, native events), fewer renders                                             |
| **Concurrent rendering** (18)   | React can pause and prioritize work to keep UI responsive                                                                           |
| `useTransition`                 | Mark an update as non-urgent (typing stays smooth while a big list filters)                                                         |
| `useDeferredValue`              | Defer re-rendering with a value that lags behind                                                                                    |
| **Suspense**                    | Declarative loading states for lazy components (and for data in frameworks/libraries that support it)                               |
| `useId`                         | Stable ids for accessibility                                                                                                        |
| **Actions and form hooks** (19) | `useActionState`, `useFormStatus`, `useOptimistic` simplify async form submits and optimistic UI                                    |
| `use` (19)                      | Read a promise or context in render (with Suspense)                                                                                 |
| `ref` as a prop (19)            | Function components can receive `ref` directly, `forwardRef` is less needed                                                         |
| **React Server Components**     | Components that run on the server only (used via frameworks such as Next.js). Know the concept: less JS shipped, direct data access |
| **React Compiler**              | Build-time tool that auto-memoizes, reducing manual `useMemo` / `useCallback`                                                       |

Interview tip: you don't need to be an expert, but being able to say what problem each feature solves shows you keep learning. Check the official React blog for the current state of these features.

---

## 13. Rendering strategies: CSR, SSR, SSG, Next.js basics

| Strategy                                  | How                                          | Good for                           | Downside                                           |
| ----------------------------------------- | -------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| **CSR** (client-side rendering)           | Browser downloads JS, renders in the browser | Dashboards, ERP, apps behind login | Slower first paint, weak SEO                       |
| **SSR** (server-side rendering)           | Server renders HTML per request              | SEO, fast first content            | Server cost, complexity                            |
| **SSG** (static site generation)          | HTML generated at build time                 | Blogs, docs, marketing             | Content stale until rebuild                        |
| **ISR** (incremental static regeneration) | SSG with timed background regeneration       | Catalogs, news                     | Framework specific                                 |
| **Hydration**                             | React attaches event handlers to server HTML |                                    | Mismatch errors if server and client output differ |

**Why ERP apps are usually CSR:** behind login, no SEO need, highly interactive.

**Next.js concepts to learn:** file-based routing, layouts, server vs client components (`'use client'`), data fetching on the server, API routes / route handlers, middleware, image optimization, environment variables.

---

## 14. Code quality and team workflow

### Tooling stack

- **oxlint / ESLint:** quality rules (`react-hooks/rules-of-hooks`, `exhaustive-deps`, `no-unused-vars`).
- **Prettier:** consistent formatting. Don't argue about style in reviews.
- **Husky + lint-staged:** run lint/format on staged files before each commit.
- **Commitlint / Conventional Commits:** `feat:`, `fix:`, `refactor:`, `chore:`.
- **Storybook:** develop and document components in isolation (nice for design systems).

### Git workflow

- Branch per task (`feature/order-export`), small focused commits, pull request with description and screenshots.
- Rebase vs merge: know both. Squash merge keeps history clean.
- Resolve conflicts calmly; pull main often.
- **Never commit** secrets, `.env` files with real values, or `node_modules`.

### Code review habits

- Reviewing others: check logic, edge cases (empty, loading, error), naming, duplication, security, test coverage. Be kind and specific.
- Receiving review: ask questions, don't take it personally, learn the team's conventions.

### Writing maintainable components

- Prefer **composition** over giant props lists.
- Keep components pure. Side effects only in effects or handlers.
- Name boolean props `isLoading`, `hasError`, `canEdit`.
- Handle all four states in every data UI: **loading, error, empty, success**.
- Avoid premature abstraction: duplicate twice, abstract on the third time.
- Document non-obvious decisions with short comments (explain _why_, not _what_).

---

## 15. Debugging production issues

### Systematic approach

1. **Reproduce:** steps, browser, user role, data. Ask for a screenshot or screen recording.
2. **Check the Network tab:** failed request? status code? response body? slow?
3. **Check the Console:** errors, warnings.
4. **Check monitoring (Sentry):** stack trace, frequency, which release.
5. **Isolate:** recent deploy? specific data? specific browser?
6. **Fix and add a regression test.**
7. **Communicate:** tell the team/users the cause and the fix. Write a short post-mortem for serious incidents.

### Tools

- React DevTools (components, profiler)
- Browser DevTools: breakpoints, `debugger`, network throttling, "Disable cache", device emulation
- `window.form = form` style debugging (development only)
- Source maps
- Redux/Zustand devtools

### Common production bugs

| Symptom                               | Likely cause                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| Works locally, fails in production    | Env variables, API URL, CORS, minification, missing SPA fallback                     |
| White screen                          | Uncaught render error with no Error Boundary, failed chunk load                      |
| Page refresh gives 404                | Server missing `index.html` fallback                                                 |
| Old UI after deploy                   | Browser cached `index.html`, service worker, CDN cache                               |
| Data not updating                     | Stale cache (React Query keys), missing invalidation, mutated state                  |
| Infinite re-render / request loop     | `setState` in render, wrong `useEffect` dependencies, new object in dependency array |
| `Cannot read properties of undefined` | Missing optional chaining, data not loaded yet, API shape changed                    |
| Memory grows over time                | Missing cleanup for timers/listeners/subscriptions                                   |
| Form shows old values in modal        | Form not reset/destroyed on close                                                    |

---

## 16. Pre-release checklist

- [ ] No `console.log`, `debugger`, `window.form` debug lines
- [ ] Lint, type-check and tests pass in CI
- [ ] Loading, error and empty states handled
- [ ] Permissions checked on UI and (verify) on server
- [ ] No secrets in code
- [ ] Environment variables set for the target environment
- [ ] Tested in required browsers and screen sizes
- [ ] Large lists paginated or virtualized
- [ ] Bundle size checked for unexpected growth
- [ ] Error monitoring active and source maps uploaded
- [ ] Rollback plan known
- [ ] Release notes written

---

## 17. Production scenario interview questions

Practice answering out loud in about 1 to 2 minutes each: **problem, approach, trade-offs**.

1. **The page is slow with 50,000 rows. What do you do?** Profile first. Server-side pagination or filtering; if all data must show, virtualize rows; memoize columns and rows; avoid heavy per-row components; debounce filters.
2. **A user reports a white screen after a deploy.** Check console and Sentry. Likely a failed chunk (old hash) or runtime error. Add Error Boundary and chunk-load error handling; roll back if urgent.
3. **How do you structure a large React app?** Feature-based folders, shared layer, API layer, absolute imports, lint rules, clear boundaries between features.
4. **How do you handle authentication and token expiry?** Access token plus refresh token (httpOnly cookie), Axios interceptor to refresh on 401 once, queue concurrent requests, logout on refresh failure.
5. **How do you protect routes and buttons by role?** Route guard component plus `usePermission` / `<Can>`; and server-side enforcement because frontend checks are only UX.
6. **How do you avoid duplicate API calls and stale data?** React Query: caching, deduplication, `staleTime`, invalidation after mutations.
7. **How do you test a form?** React Testing Library: render, type, submit, assert validation messages and API call (mock with MSW).
8. **How would you share a component library across teams?** Separate package or monorepo workspace, Storybook docs, semantic versioning, design tokens.
9. **A form inside a modal shows previous data when reopened.** Form instance persists. Use `destroyOnClose` or `resetFields` on open; set values in an effect keyed on the record id.
10. **How do you handle two users editing the same record?** Version/`updatedAt` field with optimistic locking: server returns 409 Conflict, UI shows a merge or reload message.
11. **How do you manage environment-specific config?** Env files per environment, build-time injection, no secrets in the client, or runtime config JSON loaded at startup for "build once, deploy anywhere".
12. **How would you migrate a codebase from JavaScript to TypeScript?** Incrementally: enable `allowJs`, convert leaf files and shared types first, turn on stricter flags gradually, stop new JS files.
13. **What do you do when a library has a security vulnerability?** `npm audit`, check if the vulnerable path is used, upgrade or patch, test, deploy, add automated dependency updates.
14. **How do you decide between Context, Zustand and React Query?** Server data goes to React Query; shared client state to Zustand; rarely-changing app-wide values (theme, locale) to Context.
15. **Describe a bug you debugged.** Use a STAR story (see my main notes, section 16).

---

## 18. 8-week plan

| Week | Topic                   | Practice project / output                                                             |
| ---- | ----------------------- | ------------------------------------------------------------------------------------- |
| 1    | TypeScript basics       | Convert a small JS project to TS; type props, state, API                              |
| 2    | React Query             | Rebuild a list/detail/edit flow using `useQuery` + `useMutation`                      |
| 3    | Testing                 | Write 10 React Testing Library tests; mock API with MSW                               |
| 4    | Error handling and auth | Add Error Boundary, Axios interceptors, login, protected routes, `<Can>`              |
| 5    | Performance             | Profile an app, lazy-load routes, virtualize a long list; record before/after numbers |
| 6    | Build and deploy        | Deploy to Netlify/Vercel; set up GitHub Actions (lint, test, build)                   |
| 7    | Next.js basics          | Small app with SSR page, layouts and a route handler                                  |
| 8    | Mock interviews         | Answer sections 17 and 14 (main notes) out loud; refine STAR stories                  |

**Capstone idea (portfolio piece for GitHub):** a mini ERP, with login and roles, orders list (server-side pagination, filters in URL), order form with line items (`Form.List`), dashboard with AntV charts, Zustand for UI state, React Query for server data, TypeScript, tests, CI pipeline, deployed link and a clear README. This single project covers almost everything above.

---

_Last updated: October 2026_
