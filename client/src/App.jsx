import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContexts"

import Login from "./pages/Auth/Login";
import AdminRoutes from "./routes/AdminRoutes";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />

          {/* ADMIN */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
