import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import lightstormLogo from "@/assets/lightstorm-logo.png";
import vegaLogo from "@/assets/vega-logo.png";
import { useAuth } from "./AuthContext";
import { PORTAL_ID_MAP } from "./api";
import { PORTALS, navigateToPortal } from "./portalNav";
import { cn } from "@/lib/utils";

export default function PortalSelectionPage() {
  const { user, hasAccess, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loadingPortal, setLoadingPortal] = useState<string | null>(null);

  // Reset loading spinner on normal mount AND when restoring from browser Back button (bfcache).
  // Simultaneously trigger a background role sync.
  useEffect(() => {
    refreshUser();
    setLoadingPortal(null);

    const handlePageShow = (event: PageTransitionEvent) => {
      // event.persisted = true means the page was restored from browser memory (Back button clicked)
      if (event.persisted) {
        setLoadingPortal(null);
        refreshUser();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [refreshUser]);

  const handlePortalClick = (portal: (typeof PORTALS)[0]) => {
    const portalKey = PORTAL_ID_MAP[portal.id];
    if (!hasAccess(portalKey)) return;

    setLoadingPortal(portal.id);

    // Safety fallback: clear spinner if navigation hangs for over 5 seconds.
    const safetyTimer = setTimeout(() => setLoadingPortal(null), 5000);

    setTimeout(() => {
      clearTimeout(safetyTimer);
      // All URL building and portal-switching logic lives in portalNav.ts.
      navigateToPortal(portal, navigate);
    }, 600);
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card/50">
        <div />
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-muted-foreground">
              Welcome,{" "}
              <span className="font-semibold text-foreground">
                {user.username}
              </span>
            </span>
          )}
          <button
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={lightstormLogo} alt="Lightstorm" className="w-20 h-20" />
            <h1 className="text-4xl font-bold text-foreground">Lightstorm</h1>
          </div>
          <p className="text-xl text-muted-foreground mt-4">
            Select a portal to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl w-full">
          {PORTALS.map((portal) => {
            const portalKey = PORTAL_ID_MAP[portal.id];
            const accessible = hasAccess(portalKey);

            return (
              <Card
                key={portal.id}
                className={cn(
                  "transition-all duration-300 group border-0 text-white relative overflow-hidden",
                  portal.bgColor,
                  accessible && portal.hoverColor,
                  accessible &&
                    "cursor-pointer hover:scale-105 hover:shadow-2xl",
                  !accessible && "opacity-40 grayscale cursor-not-allowed",
                  loadingPortal === portal.id && "scale-105 shadow-2xl",
                  loadingPortal &&
                    loadingPortal !== portal.id &&
                    "opacity-50 pointer-events-none",
                )}
                onClick={() => handlePortalClick(portal)}
              >
                <CardHeader className="text-center space-y-4 p-6">
                  <div
                    className={cn(
                      "mx-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300",
                      loadingPortal === portal.id
                        ? "scale-110"
                        : accessible
                          ? "group-hover:scale-110"
                          : "",
                    )}
                  >
                    {loadingPortal === portal.id ? (
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : !accessible ? (
                      <Lock className="w-10 h-10 text-white/60" />
                    ) : (
                      <portal.icon className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-white">
                    {portal.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-white/80 line-clamp-2">
                    {!accessible ? "Access restricted" : portal.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 flex items-center justify-center gap-2 text-sm border-t">
        <img src={vegaLogo} alt="Vegayan" className="w-6 h-6" />
        <span className="text-muted-foreground">Managed by Vegayan 2026</span>
      </footer>
    </div>
  );
}
