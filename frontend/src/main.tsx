import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route } from "react-router";
import { Home } from "./views/Home.tsx";
import { Routes } from "react-router";
import { RootLayout } from "./components/layout/RootLayout.tsx";
import { LoginUpdated } from "./components/auth/LoginUpdated.tsx";
import { RegisterWithSteps } from "./components/auth/RegisterWithSteps.tsx";
import { VaultManager } from "./views/VaultManager.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="vault" element={<VaultManager />} />
          </Route>

          <Route path="login" element={<LoginUpdated />} />
          <Route path="register" element={<RegisterWithSteps />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
