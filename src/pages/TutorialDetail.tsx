import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = "http://127.0.0.1:8000/api";

interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  video_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
  return match ? match[1] : null;
};

const TutorialDetail = () => {
  const navigate = useNavigate();
  const { tutorialId } = useParams();
  const location = useLocation();
  const [tutorial, setTutorial] = useState<Tutorial | null>(location.state?.tutorial || null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!tutorial && tutorialId) {
      // Fetch single tutorial if navigated directly
      fetch(`${API_BASE_URL}/tutorials?per_page=50&page=1`, {
        headers: { Accept: "application/json" },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const found = data.tutorials.find((v: Tutorial) => v.id === Number(tutorialId));
            if (found) setTutorial(found);
          }
        })
        .catch(() => {});
    }
  }, [tutorial, tutorialId]);

  const getThumbnailUrl = (url: string) => {
    if (url?.startsWith("http://127.0.0.1")) {
      return url.replace("http://127.0.0.1:8000", "https://discountpanel.shop");
    }
    return url;
  };

  if (!tutorial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const youtubeId = tutorial.video_url ? getYouTubeId(tutorial.video_url) : null;
  const isVideo = !!tutorial.video_url;

  return (
    <div className="min-h-screen bg-background pb-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top"
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground line-clamp-1 flex-1">{tutorial.title}</h1>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-4">
        {/* Video / Thumbnail */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden bg-muted aspect-video"
        >
          {showVideo && youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={tutorial.title}
            />
          ) : (
            <>
              {tutorial.thumbnail ? (
                <img
                  src={getThumbnailUrl(tutorial.thumbnail)}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                />
              ) : youtubeId ? (
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Play className="w-16 h-16 text-primary" />
                </div>
              )}
              {isVideo && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </div>
                </button>
              )}
            </>
          )}
        </motion.div>

        {/* Play button */}
        {isVideo && !showVideo && (
          <Button onClick={() => setShowVideo(true)} className="w-full gap-2 rounded-xl h-12">
            <Play className="w-5 h-5" />
            Play Video
          </Button>
        )}

        {/* Info */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">{tutorial.title}</h2>

          {tutorial.duration && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{tutorial.duration}</span>
            </div>
          )}

          {tutorial.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {tutorial.description}
            </p>
          )}

          {tutorial.video_url && !youtubeId && (
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl"
              onClick={() => window.open(tutorial.video_url, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              Open Video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialDetail;
