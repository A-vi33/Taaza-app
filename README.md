# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 🔥 Firebase Integration
- Firebase initialized in `src/firebase.js` with Auth, Firestore, and Storage.
- Use `import { auth, db, storage } from './firebase'` in your components.

## 🛣️ Routing Structure
- Customer routes: `/`, `/cart`, `/orders`
- Admin routes: `/admin/login`, `/admin/dashboard`

## 🗂️ Project Structure (Key Folders)
- `src/components/pages/` — All page components (customer & admin)
- `src/components/routers/` — App routing logic
- `src/components/layout/` — Layout wrapper (header, footer, router)

## 🚀 Next Steps
- Implement authentication (customer & admin)
- Build product listing, cart, and order flows
- Build admin dashboard, product, and employee management
- Integrate payment and notifications

---
