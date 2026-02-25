import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Success",
        description: "Welcome back!",
      });
      navigate("/home");
    } else {
      toast({
        title: "Login Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-background flex flex-col">
      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to App</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card rounded-3xl p-8 shadow-lg"
        >
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Badge shape */}
                <path
                  d="M50 5L65 15L80 15L85 30L95 45L90 60L95 75L80 85L65 95L50 90L35 95L20 85L5 75L10 60L5 45L15 30L20 15L35 15L50 5Z"
                  fill="white"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                />
                {/* Key icon */}
                <circle cx="50" cy="40" r="12" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
                <rect x="48" y="50" width="4" height="20" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
                <rect x="52" y="58" width="8" height="3" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
                <rect x="52" y="65" width="6" height="3" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
                {/* Decorative dots */}
                <circle cx="72" cy="35" r="3" fill="#3B82F6" />
                <circle cx="28" cy="50" r="3" fill="#EF4444" />
                <circle cx="72" cy="55" r="3" fill="#10B981" />
                {/* Lines */}
                <line x1="70" y1="45" x2="82" y2="45" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                <line x1="70" y1="52" x2="78" y2="52" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">Log in to your account</h1>
          <p className="text-muted-foreground text-center mb-8">Welcome back! Please enter your details.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Lora.xa@xample.com"
                className="h-12 rounded-xl border-border bg-background"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••••"
                  className="h-12 rounded-xl border-border bg-background pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me
                </Label>
              </div>
              <button type="button" className="text-sm text-primary font-medium">
                Forgot password
              </button>
            </div>

            {/* Sign In Button */}
            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-base font-semibold">
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            {
              //Google Sign In - Temporarily commented out
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl text-base font-medium border-border"
                onClick={() => {
                  window.location.href = "https://discountpanel.shop/auth/google";
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            }
          </form>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-muted-foreground">
            Don't have an account?{" "}
            <button type="button" className="text-primary font-medium">
              Sign up
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
