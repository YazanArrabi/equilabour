import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";
import { Footer } from "./Footer";
import { AdSidebar } from "./AdSidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F3F2EF] flex flex-col">
      <NavBar />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4">
        <div className="flex gap-5 items-start">
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
          {user !== null && <AdSidebar />}
        </div>
      </div>

      <Footer />
    </div>
  );
}
