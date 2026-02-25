import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Clock, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { API_BASE_URL, BASE_DOMAIN } from "@/lib/api";


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

const Tutorials = () => {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchTutorials = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/tutorials?per_page=10&page=${pageNum}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await response.json();
      if (data.success && data.tutorials) {
        setTutorials((prev) => pageNum === 1 ? data.tutorials : [...prev, ...data.tutorials]);
        setHasMore(pageNum < data.pagination.last_page);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutorials(1);
  }, [fetchTutorials]);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingRef.current && hasMore) {
        setPage((p) => {
          const next = p + 1;
          fetchTutorials(next);
          return next;
        });
      }
    }, { threshold: 0.1 });
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, fetchTutorials]);

  const getThumbnailUrl = (url: string) => {
    if (url.startsWith("http://127.0.0.1")) {
      return url.replace("http://127.0.0.1:8000", BASE_DOMAIN);
    }
    return url;
  };

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
          <h1 className="text-xl font-bold text-foreground">Tutorials</h1>
        </div>
      </motion.header>

      <div className="px-4 py-4 space-y-3">
        {initialLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 bg-card rounded-xl border border-border/50">
                <Skeleton className="w-28 h-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))
          : tutorials.map((tutorial, index) => (
              <motion.button
                key={tutorial.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => navigate(`/tutorial/${tutorial.id}`, { state: { tutorial } })}
                className="flex gap-3 w-full p-3 bg-card rounded-xl border border-border/50 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="relative w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {tutorial.thumbnail ? (
                    <img
                      src={getThumbnailUrl(tutorial.thumbnail)}
                      alt={tutorial.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  {tutorial.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2">{tutorial.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{tutorial.description}</p>
                  {tutorial.duration && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{tutorial.duration}</span>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}

        {isLoading && !initialLoading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!initialLoading && !isLoading && tutorials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">No tutorials found</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new tutorials</p>
          </div>
        )}

        {!hasMore && tutorials.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">No more tutorials</p>
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
};

export default Tutorials;
