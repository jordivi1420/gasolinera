// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

// UI
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";

// Charts
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";

// Tools
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";

// Layout
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

// Admin
import RequireAdmin from "./routes/RequireAdmin";
import AdminSucursalesPage from "./pages/admin/sucursales/AdminSucursalesPage";
import SucursalForm from "./pages/admin/sucursales/SucursalForm";
import SucursalView from "./pages/admin/sucursales/SucursalView";
import SucursalManageLayout from "./pages/admin/sucursales/manage/SucursalManageLayout";
import SubcentrosPage from "./pages/admin/sucursales/manage/SubcentrosPage";
import ContratistasPage from "./pages/admin/sucursales/manage/ContratistasPage";
import UsuariosPage from "./pages/admin/sucursales/manage/UsuariosPage";
import ReportesPage from "./pages/admin/sucursales/manage/ReportesPage";

import AdminContratistasPage from "./pages/admin/contratistas/AdminContratistasPage";
import ContratistaForm from "./pages/admin/contratistas/ContratistaForm";
import CentrosPage from "./pages/admin/contratistas/centros/CentrosPage";
import AdminSubcentrosPage from "./pages/admin/contratistas/centros/subcentros/SubcentrosPage";

// Contractor
import RequireContractor from "./routes/RequireContractor";
import ContratistaSucursalesPage from "./pages/contratista/sucursales/ContratistaSucursalesPage";
import CentrosLayout from "./pages/contratista/sucursales/centros/manage/CentroManageLayout";
import CentrosContratistaPage from "./pages/contratista/sucursales/centros/manage/CentrosPage";
import SubcentrosContratistaPage from "./pages/contratista/sucursales/centros/subcentros/SubcentrosPage";

// Vehículos POR SUCURSAL
import VehiculosSucursalPage from "./pages/contratista/sucursales/centros/manage/Vehiculos";
import VehiculoForm from "./pages/contratista/sucursales/centros/manage/Components/VehiculoForm";

// Subcentro manage (empleados, reportes)
import CentroManageLayout from "./pages/contratista/sucursales/centros/subcentros/manage/CentroManageLayout";
import Empleados from "./pages/contratista/sucursales/centros/subcentros/manage/Empleados";

// Guards
import RequireAuth from "./routes/RequireAuth";
import RedirectIfAuth from "./routes/RedirectIfAuth";

// Auth provider
import { AuthProvider } from "./context/AuthContext";

// ======================================================================

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <AuthProvider>
        <Suspense fallback={<div className="p-6">Cargando…</div>}>

          <Routes>

            {/* ================= PUBLIC ================= */}
            <Route element={<RedirectIfAuth />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/contractor/signin" element={<SignIn />} />
            </Route>

            {/* ================= AUTH PROTECTED ================= */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>

                <Route index element={<Home />} />

                {/* UI pages */}
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

                {/* ================= ADMIN AREA ================= */}
                <Route element={<RequireAdmin />}>

                  <Route path="/admin" element={<Navigate to="/admin/sucursales" replace />} />

                  {/* Sucursales */}
                  <Route path="/admin/sucursales" element={<AdminSucursalesPage />} />
                  <Route path="/admin/sucursales/nueva" element={<SucursalForm />} />
                  <Route path="/admin/sucursales/:id/editar" element={<SucursalForm />} />
                  <Route path="/admin/sucursales/:sucursalId" element={<SucursalView />} />

                  <Route
                    path="/admin/sucursales/:sucursalId/gestionar"
                    element={<SucursalManageLayout />}
                  >
                    <Route index element={<Navigate to="contratistas" replace />} />
                    <Route path="subcentros" element={<SubcentrosPage />} />
                    <Route path="contratistas" element={<ContratistasPage />} />
                    <Route path="usuarios" element={<UsuariosPage />} />
                    <Route path="reportes" element={<ReportesPage />} />
                  </Route>

                  {/* Contratistas */}
                  <Route path="/admin/contratistas" element={<AdminContratistasPage />} />
                  <Route path="/admin/contratistas/nueva" element={<ContratistaForm />} />
                  <Route path="/admin/contratistas/:id/editar" element={<ContratistaForm />} />

                  {/* Centros & Subcentros (Admin) */}
                  <Route
                    path="/admin/sucursales/:sucursalId/contratistas/:contractorId/centros"
                    element={<CentrosPage />}
                  />

                  <Route
                    path="/admin/sucursales/:sucursalId/contratistas/:contractorId/centros/:centroId/subcentros"
                    element={<AdminSubcentrosPage />}
                  />

                </Route>

                {/* ================= CONTRACTOR AREA ================= */}
                <Route element={<RequireContractor />}>

                  {/* Sucursales */}
                  <Route
                    path="/c/:branchId/:contractorId/sucursales"
                    element={<ContratistaSucursalesPage />}
                  />

                  <Route
                    path="/c/:branchId/:contractorId/perfil"
                    element={<UserProfiles />}
                  />

                  {/* Centros tab + Vehículos por sucursal */}
                  <Route
                    path="/c/:branchId/:contractorId/centros"
                    element={<CentrosLayout />}
                  >
                    <Route index element={<CentrosContratistaPage />} />
                    <Route path="vehiculos" element={<VehiculosSucursalPage />} />
                  </Route>

                  {/* Vehículos POR SUCURSAL (CRUD) */}
                  <Route
                    path="/c/:branchId/vehiculos"
                    element={<VehiculosSucursalPage />}
                  />

                  <Route
                    path="/c/:branchId/vehiculos/nuevo"
                    element={<VehiculoForm />}
                  />

                  <Route
                    path="/c/:branchId/vehiculos/:vehiculoId"
                    element={<VehiculoForm />}
                  />

                  <Route
                    path="/c/:branchId/vehiculos/:vehiculoId/editar"
                    element={<VehiculoForm />}
                  />

                  {/* Subcentros (solo para empleados/reportes) */}
                  <Route
                    path="/c/:branchId/:contractorId/centros/:centroId/subcentros"
                    element={<SubcentrosContratistaPage />}
                  />

                  <Route
                    path="/c/:branchId/:contractorId/centros/:centroId/subcentros/:subcentroId/manage"
                    element={<CentroManageLayout />}
                  >
                    <Route index element={<Navigate to="empleados" replace />} />
                    <Route path="empleados" element={<Empleados />} />
                    <Route path="reportes" element={<ReportesPage />} />
                  </Route>

                </Route>
              </Route>
            </Route>

            {/* Not found */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

// Simple report placeholder

