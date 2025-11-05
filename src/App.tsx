import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense } from "react";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import AdminSucursalesPage from "./pages/admin/sucursales/AdminSucursalesPage";
import SucursalForm from "./pages/admin/sucursales/SucursalForm";
import AdminContratistasPage from "./pages/admin/contratistas/AdminContratistasPage";
import ContratistaForm from "./pages/admin/contratistas/ContratistaForm";

import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

// Protección
import RequireAuth from "./routes/RequireAuth";
import RequireAdmin from "./routes/RequireAdmin";
import RedirectIfAuth from "./routes/RedirectIfAuth";

// Auth
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Suspense fallback={<div className="p-6">Cargando…</div>}>
          <Routes>
            {/* Rutas públicas SOLO si NO estás autenticado */}
            <Route element={<RedirectIfAuth />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Route>

            {/* Rutas protegidas (requieren login) */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                {/* Home del dashboard */}
                <Route index element={<Home />} />

                {/* Páginas existentes */}
                <Route path="/profile" element={<UserProfiles />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/blank" element={<Blank />} />
                <Route path="/form-elements" element={<FormElements />} />
                <Route path="/basic-tables" element={<BasicTables />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/avatars" element={<Avatars />} />
                <Route path="/badge" element={<Badges />} />
                <Route path="/buttons" element={<Buttons />} />
                <Route path="/images" element={<Images />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/line-chart" element={<LineChart />} />
                <Route path="/bar-chart" element={<BarChart />} />

                {/* SOLO Administrador Global */}
                <Route element={<RequireAdmin />}>
                  <Route
                    path="/admin"
                    element={<Navigate to="/admin/sucursales" replace />}
                  />
                  <Route
                    path="/admin/sucursales"
                    element={<AdminSucursalesPage />}
                  />
                  <Route
                    path="/admin/sucursales/nueva"
                    element={<SucursalForm />}
                  />
                  <Route
                    path="/admin/sucursales/:id/editar"
                    element={<SucursalForm />}
                  />
                  <Route 
                    path="/admin/contratistas" 
                    element={<AdminContratistasPage />} 
                  />
                  <Route 
                    path="/admin/contratistas/nueva" 
                    element={<ContratistaForm />} 
                  />
                  <Route 
                    path="/admin/contratistas/:id/editar" 
                  element={<ContratistaForm />} 
                  />

                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
