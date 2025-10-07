import React from "react";
import { Outlet } from "react-router";
import { Box, Container } from "@mui/material";
import { Navigation } from "./Navigation";
import { ResetAll } from "../__RESET/ResetAll";

export const RootLayout: React.FC = () => {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <ResetAll />
      <Navigation />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
};
