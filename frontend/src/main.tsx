import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route } from "react-router";
import { Home } from "./views/Home.tsx";
import { Routes } from "react-router";
import { AuthLayout } from "./components/auth/AuthLayout.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { RootLayout } from "./components/layout/RootLayout.tsx";
import { Login } from "./components/auth/Login.tsx";
import { Register } from "./components/auth/Register.tsx";
import { Vault } from "./views/Vault.tsx";
import { ProtectedRoute } from "./components/auth/ProtectedRoute.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route
              path="vault"
              element={
                <ProtectedRoute requireAuth checkRouteAccess>
                  <Vault />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
