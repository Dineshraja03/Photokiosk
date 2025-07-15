import { useState, useEffect } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { PhotographerDashboard } from "@/components/PhotographerDashboard";
import { CounterStaffDashboard } from "@/components/CounterStaffDashboard";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<{ role: string; username?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (role: string, username?: string) => {
    setCurrentUser({ role, username });
    localStorage.setItem("currentUser", JSON.stringify({ role, username }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  if (currentUser?.role === "photographer") {
    return <PhotographerDashboard username={currentUser.username} />;
  }

  if (currentUser?.role === "operator") {
    return <CounterStaffDashboard username={currentUser.username} />;
  }

  if (currentUser?.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-4">Welcome to the admin portal</p>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return <AuthDialog onLogin={handleLogin} />;
};

export default Index;
