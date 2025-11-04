// src/pages/admin/sucursales/AdminSucursalesPage.tsx
import SucursalesKpis from "./components/SucursalesKpis";
import SucursalesTable from "./components/SucursalesTable";

export default function AdminSucursalesPage() {
  return (
    <div className="space-y-6">
      <SucursalesKpis />
      <SucursalesTable />
    </div>
  );
}
