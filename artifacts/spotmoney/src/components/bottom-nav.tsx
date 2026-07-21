import { Link, useLocation } from "wouter";
import { Home, PlaySquare, CheckSquare, Users, Wallet } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/earn", icon: PlaySquare, label: "Earn" },
    { path: "/tasks", icon: CheckSquare, label: "Tasks" },
    { path: "/referral", icon: Users, label: "Friends" },
    { path: "/withdraw", icon: Wallet, label: "Withdraw" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-background/80 backdrop-blur-xl border-t border-border px-2 py-2 flex justify-between items-center z-50 rounded-t-2xl">
      {tabs.map((tab) => {
        const isActive = location === tab.path;
        const Icon = tab.icon;
        return (
          <Link key={tab.path} href={tab.path} className="flex-1 flex flex-col items-center justify-center gap-1.5 text-[10px]">
            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary text-primary-foreground scale-110' : 'text-muted-foreground hover:bg-secondary/50'}`}>
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`font-semibold transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
