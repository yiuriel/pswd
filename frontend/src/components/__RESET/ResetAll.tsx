import { Box, Button } from "@mui/material";
import { resetDb } from "../../helpers/api";

export const ResetAll = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        right: 8,
        bottom: 8,
      }}
    >
      <Button variant="contained" color="error" onClick={resetDb}>
        Reset All
      </Button>
    </Box>
  );
};
