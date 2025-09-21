import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route } from "react-router";
import { Home } from "./views/Home.tsx";
import { Routes } from "react-router";
import { AuthLayout } from "./components/auth/AuthLayout.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />

        <Route element={<AuthLayout />}>
          <Route path="login" element={<>login</>} />
          <Route path="register" element={<>register</>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
