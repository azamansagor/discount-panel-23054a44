import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface OnboardingSlide {
  image: string;
  title: string;
  subtitle: string;
}

const slides: OnboardingSlide[] = [
  {
    image: "/onboarding-1.svg",
    title: "Discover Amazing Deals",
    subtitle: "Find the best discounts from your favorite stores all in one place",
  },
  {
    image: "/onboarding-2.svg",
    title: "Save Money Everyday",
    subtitle: "Unlock exclusive offers and save up to 70% on your purchases",
  },
  {
    image: "/onboarding-3.svg",
    title: "Shop Smarter",
    subtitle: "Get personalized recommendations based on your preferences",
  },
];

export const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Skip onboarding if already seen
  const hasSeenOnboarding = localStorage.getItem("onboarding_seen");
  if (hasSeenOnboarding) {
    navigate("/home", { replace: true });
    return null;
  }

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_seen", "true");
    navigate("/home", { replace: true });
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset-top safe-area-inset-bottom">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="text-muted-foreground font-medium text-sm hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Illustration */}
            <div className="w-64 h-64 mb-12 flex items-center justify-center">
              <OnboardingIllustration index={currentSlide} />
            </div>

            {/* Text */}
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {slides[currentSlide].title}
            </h1>
            <p className="text-muted-foreground text-base max-w-xs">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-8">
        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 gradient-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Next/Get Started button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-card"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </motion.button>
      </div>
    </div>
  );
};

// Custom illustrations for each slide
const OnboardingIllustration = ({ index }: { index: number }) => {
  const illustrations = [
    // Slide 1: Shopping bags with discount tag
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <circle cx="100" cy="100" r="80" fill="hsl(239 84% 67% / 0.1)" />
      <rect x="60" y="80" width="40" height="50" rx="4" fill="hsl(239 84% 67%)" />
      <rect x="65" y="75" width="30" height="10" rx="2" fill="hsl(239 84% 57%)" />
      <rect x="100" y="70" width="50" height="60" rx="4" fill="hsl(24 95% 53%)" />
      <rect x="107" y="63" width="36" height="12" rx="2" fill="hsl(24 95% 43%)" />
      <circle cx="140" cy="60" r="20" fill="hsl(142 71% 45%)" />
      <text x="140" y="65" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">%</text>
      <path d="M70 150 L130 150" stroke="hsl(239 84% 67% / 0.3)" strokeWidth="3" strokeLinecap="round" />
    </svg>,
    // Slide 2: Piggy bank with coins
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <circle cx="100" cy="100" r="80" fill="hsl(24 95% 53% / 0.1)" />
      <ellipse cx="100" cy="110" rx="55" ry="40" fill="hsl(24 95% 53%)" />
      <circle cx="70" cy="100" r="8" fill="hsl(24 95% 43%)" />
      <ellipse cx="130" cy="130" rx="10" ry="15" fill="hsl(24 95% 43%)" />
      <rect x="85" y="65" width="30" height="8" rx="4" fill="hsl(239 84% 67%)" />
      <circle cx="55" cy="55" r="15" fill="hsl(38 92% 50%)" stroke="hsl(38 92% 40%)" strokeWidth="2" />
      <text x="55" y="60" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">$</text>
      <circle cx="150" cy="50" r="12" fill="hsl(38 92% 50%)" stroke="hsl(38 92% 40%)" strokeWidth="2" />
      <circle cx="165" cy="75" r="10" fill="hsl(38 92% 50%)" stroke="hsl(38 92% 40%)" strokeWidth="2" />
    </svg>,
    // Slide 3: Phone with shopping items
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <circle cx="100" cy="100" r="80" fill="hsl(142 71% 45% / 0.1)" />
      <rect x="65" y="40" width="70" height="120" rx="10" fill="hsl(224 71% 8%)" />
      <rect x="70" y="50" width="60" height="100" rx="4" fill="hsl(0 0% 98%)" />
      <rect x="75" y="55" width="50" height="20" rx="3" fill="hsl(239 84% 67%)" />
      <rect x="75" y="80" width="50" height="15" rx="3" fill="hsl(220 14% 96%)" />
      <rect x="75" y="100" width="50" height="15" rx="3" fill="hsl(220 14% 96%)" />
      <rect x="75" y="120" width="50" height="25" rx="3" fill="hsl(24 95% 53%)" />
      <circle cx="150" cy="60" r="20" fill="hsl(142 71% 45%)" />
      <path d="M142 60 L148 66 L160 54" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
  ];

  return illustrations[index];
};

export default OnboardingScreen;
