import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
