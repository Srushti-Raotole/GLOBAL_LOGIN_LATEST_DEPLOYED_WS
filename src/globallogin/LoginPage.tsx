import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";
import { loginWithSSO } from "./api";
import loginIcon from "@/assets/lightstorm-logo.png";
import vegaLogo from "@/assets/vega-logo.png";
import { Loader2, Globe, Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isAuthenticated) navigate("/portals", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => initCanvas(canvas));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login(username, password);
      setPassword("");
      toast({ title: "Login Successful" });
      navigate("/portals");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.response?.data?.message ?? err?.message ?? "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLTCLogin = () => {
    toast({ title: "LTC Login", description: "Redirecting to LTC SSO authentication..." });
    loginWithSSO();
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Reset Link Sent", description: `Password reset link has been sent to ${resetEmail}` });
    setShowForgotPassword(false);
    setResetEmail("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />

      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-[#0a0e27]/40 via-transparent to-[#b71d4c]/10 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        <div className="hidden lg:flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <div className="relative inline-block mb-8">
              <img
                src={vegaLogo}
                alt="Vegayan"
                className="relative w-28 h-28 mx-auto"
              />
            </div>
            <h2 className="text-5xl xl:text-6xl font-extralight text-white/90 tracking-wider">
              Simplifying
            </h2>
            <h2 className="text-5xl xl:text-6xl font-bold bg-gradient-to-r from-[#b71d4c] to-[#ed8c38] bg-clip-text text-transparent tracking-wide mt-3">
              NextGen Networks
            </h2>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
              <p className="text-white/50 text-sm tracking-[0.25em] uppercase">Managed by Vegayan</p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
            </div>
          </div>
        </div>

        <div className="lg:hidden fixed top-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl text-white/90 font-light tracking-wide drop-shadow-lg">
              Simplifying{" "}
              <span className="font-semibold bg-gradient-to-r from-[#b71d4c] to-[#ed8c38] bg-clip-text text-transparent">
                NextGen Networks
              </span>
            </p>
          </div>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[440px] flex items-center justify-center p-4 lg:pr-16">
          <div className="w-full max-w-sm">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/20 via-white/5 to-white/10 pointer-events-none" />

              <div className="relative bg-[#0f1328]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-center gap-3 pt-8 pb-4">
                  <div className="relative">
                    <img src={loginIcon} alt="Login" className="relative w-14 h-14" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white tracking-tight block">Lightstorm</span>
                    
                  </div>
                </div>

                <div className="px-7 pb-7">
                  <Button
                    onClick={handleLTCLogin}
                    className="w-full mb-4 bg-gradient-to-r from-[#b71d4c] to-[#9a1840] hover:from-[#c92258] hover:to-[#b71d4c] text-white h-11 rounded-xl font-medium shadow-lg shadow-[#b71d4c]/20 transition-all duration-300 hover:shadow-[#b71d4c]/40 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isSubmitting}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    LTC User Login (SSO)
                  </Button>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-4 text-white/30 bg-[#0f1328]/80">or sign in with credentials</span>
                    </div>
                  </div>

                  <form onSubmit={handleStandardLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-white/60 text-xs font-medium tracking-wide">
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="h-10 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-[#b71d4c]/50 focus:border-[#b71d4c]/50 transition-all duration-200 hover:bg-white/[0.07]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-white/60 text-xs font-medium tracking-wide">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-10 pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-[#b71d4c]/50 focus:border-[#b71d4c]/50 transition-all duration-200 hover:bg-white/[0.07]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-2 shrink-0">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(c) => setRememberMe(c as boolean)}
                          className="border-white/20 data-[state=checked]:bg-[#b71d4c] data-[state=checked]:border-[#b71d4c]"
                        />
                        <label htmlFor="remember" className="text-xs text-white/40 cursor-pointer whitespace-nowrap">
                          Remember me
                        </label>
                      </div>
                      {/* <button
                        type="button"
                        className="text-xs text-[#ed8c38]/70 hover:text-[#ed8c38] transition-colors whitespace-nowrap"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot password?
                      </button> */}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-white/10 hover:bg-white/15 text-white h-11 rounded-xl font-medium border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" /> SIGN IN
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 z-10 flex justify-center">
        <p className="text-white/30 text-xs tracking-wider">© 2026 Vegayan. All rights reserved.</p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md bg-[#0f1328] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Reset Password</DialogTitle>
            <DialogDescription className="text-white/50">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-white/60">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} className="border-white/10 text-white/60 hover:bg-white/5">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#b71d4c] hover:bg-[#9a1840] rounded-xl">
                Send Reset Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Canvas animation (network nodes background) ──
function initCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let dpr = Math.max(window.devicePixelRatio || 1, 1);
  let w = window.innerWidth;
  let h = window.innerHeight;

  const resize = () => {
    dpr = Math.max(window.devicePixelRatio || 1, 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildNodes();
  };

  class Node {
    x = 0; y = 0; vx = 0; vy = 0; r = 0; status: "up" | "down" = "up";
    constructor() { this.reset(true); }
    reset(randPos = true) {
      this.x = randPos ? Math.random() * w : ((this.x % w) + w) % w;
      this.y = randPos ? Math.random() * h : ((this.y % h) + h) % h;
      const sf = Math.max(0.2, Math.min(1.2, Math.sqrt(w * h) / 1500));
      this.vx = (Math.random() - 0.5) * 0.6 * sf;
      this.vy = (Math.random() - 0.5) * 0.6 * sf;
      this.r = Math.max(1.5, Math.round(Math.min(4, Math.sqrt(w * h) / 2500)));
      this.status = Math.random() > 0.25 ? "up" : "down";
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < -50) this.x = w + 50; if (this.x > w + 50) this.x = -50;
      if (this.y < -50) this.y = h + 50; if (this.y > h + 50) this.y = -50;
      if (Math.random() < 0.0008) this.status = this.status === "up" ? "down" : "up";
    }
    draw(c: CanvasRenderingContext2D) {
      c.save();
      const g = this.status === "up" ? "rgba(16,185,129,0.8)" : "rgba(239,68,68,0.8)";
      c.shadowBlur = Math.min(20, this.r * 5); c.shadowColor = g;
      c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      c.fillStyle = this.status === "up" ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)";
      c.fill(); c.restore();
      // Outer ring
      c.beginPath(); c.arc(this.x, this.y, this.r + 2, 0, Math.PI * 2);
      c.strokeStyle = this.status === "up" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)";
      c.lineWidth = 1; c.stroke();
    }
  }

  let nodes: Node[] = [];
  let nodeCount = 60;
  let connectionDistance = 220;

  const updateSettings = () => {
    const area = Math.max(1, w * h);
    nodeCount = Math.max(30, Math.min(100, Math.round(area / 25000)));
    connectionDistance = Math.max(80, Math.min(280, Math.round(Math.sqrt(w * w + h * h) / 7)));
  };

  function rebuildNodes() {
    updateSettings();
    const old = nodes.slice(0, nodeCount);
    nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      if (old[i]) { old[i].reset(false); nodes.push(old[i]); }
      else nodes.push(new Node());
    }
  }

  function drawConnections() {
    const dSqMax = connectionDistance * connectionDistance;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, dSq = dx * dx + dy * dy;
        if (dSq < dSqMax) {
          const t = 1 - dSq / dSqMax;
          const op = Math.max(0.04, Math.min(0.5, t * 0.45));
          let sc;
          if (a.status === "up" && b.status === "up") sc = `rgba(16,185,129,${op})`;
          else if (a.status === "down" && b.status === "down") sc = `rgba(239,68,68,${op})`;
          else sc = `rgba(251,191,36,${op * 0.7})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = sc; ctx.lineWidth = Math.max(0.3, Math.min(1.2, 1.0 * t)); ctx.stroke();
        }
      }
    }
  }

  let frameId = 0;
  function animate() {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#060a1e");
    grad.addColorStop(0.5, "#0a0e27");
    grad.addColorStop(1, "#120f24");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    // Subtle radial glow
    const rglow = ctx.createRadialGradient(w * 0.3, h * 0.5, 0, w * 0.3, h * 0.5, w * 0.5);
    rglow.addColorStop(0, "rgba(183,29,76,0.03)");
    rglow.addColorStop(1, "transparent");
    ctx.fillStyle = rglow; ctx.fillRect(0, 0, w, h);

    drawConnections();
    for (const n of nodes) { n.update(); n.draw(ctx); }
    frameId = requestAnimationFrame(animate);
  }

  resize(); rebuildNodes();
  if (frameId) cancelAnimationFrame(frameId);
  animate();

  let resizeTimeout: ReturnType<typeof setTimeout>;
  const handleResize = () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(resize, 80); };
  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);
  (canvas as any).__cleanup = () => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("orientationchange", handleResize);
    cancelAnimationFrame(frameId);
  };
}
