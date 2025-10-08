import React from "react";
import { Outlet } from "react-router";
import { Box } from "@mui/material";
import { Navigation } from "./Navigation";
import { ResetAll } from "../__RESET/ResetAll";

export const RootLayout: React.FC = () => {
  return (
    <Box sx={{ 
      minHeight: "100vh",
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d1b4e 100%)',
      position: 'relative',
    }}>
      <ResetAll />
      <Navigation />
      <Outlet />
    </Box>
  );
};
