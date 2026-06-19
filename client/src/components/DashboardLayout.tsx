import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Globe,
  Home,
  MapPin,
  Newspaper,
  PanelLeft,
  RefreshCw,
  Rss,
  Search,
  Shield,
  Trophy,
  Zap,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const menuItems = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: MapPin, label: "Cancún", path: "/categoria/cancun" },
  { icon: Globe, label: "Quintana Roo", path: "/categoria/quintana-roo" },
  { icon: Newspaper, label: "Nacional", path: "/categoria/nacional" },
  { icon: Trophy, label: "Deportes", path: "/categoria/deportes" },
  { icon: Search, label: "Buscar", path: "/buscar" },
  { icon: Rss, label: "Fuentes RSS", path: "/fuentes" },
  { icon: Shield, label: "Admin", path: "/dashboard" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-slate-200" disableTransition={isResizing}>
          {/* Header del sidebar */}
          <SidebarHeader className="h-16 justify-center border-b border-slate-100">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-500" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 leading-tight truncate">Cancún al Minuto</p>
                    <p className="text-[10px] text-slate-500 truncate">Noticias en tiempo real</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Menú de navegación */}
          <SidebarContent className="gap-0 pt-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location === "/"
                    : location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${
                        isActive
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-red-600" : "text-slate-500"}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer del sidebar */}
          <SidebarFooter className="p-3 border-t border-slate-100">
            {!isCollapsed && (
              <div className="text-[10px] text-slate-400 text-center px-2">
                © 2025 Cancún al Minuto
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        {/* Handle de resize */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-red-200 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top bar móvil */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-white px-3 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-sm text-slate-900">Cancún al Minuto</span>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        )}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
