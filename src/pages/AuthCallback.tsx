import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const userDataEncoded = searchParams.get("user");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(errorParam);
        toast({
          title: "Login Failed",
          description: errorParam,
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!token || !userDataEncoded) {
        setError("Invalid callback parameters");
        toast({
          title: "Login Failed",
          description: "Invalid callback parameters. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        // Decode user data from base64
        const userData = JSON.parse(atob(userDataEncoded));
        
        // Store the auth data
        loginWithToken(token, userData);
        
        toast({
          title: "Success",
          description: "Welcome! You've been logged in successfully.",
        });
        
        navigate("/home");
      } catch (err) {
        console.error("Failed to process auth callback:", err);
        setError("Failed to process login");
        toast({
          title: "Login Failed",
          description: "Failed to process login. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-background flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">Login Failed</p>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">Redirecting to login...</p>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Completing login...</p>
          <p className="text-muted-foreground">Please wait while we sign you in.</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
