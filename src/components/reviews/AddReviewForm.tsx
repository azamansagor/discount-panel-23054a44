import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { API_BASE_URL as API_ROOT } from "@/lib/api";

interface AddReviewFormProps {
  type: "product" | "store";
  itemId: number;
  onReviewAdded: () => void;
}

const AddReviewForm = ({ type, itemId, onReviewAdded }: AddReviewFormProps) => {
  const { user, isAuthenticated, canAddReview } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if user can't add reviews
  if (!isAuthenticated || !canAddReview) {
    return null;
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Comment must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = type === "product" 
        ? `${API_ROOT}/products/${itemId}/reviews/add`
        : `${API_ROOT}/stores/${itemId}/reviews/add`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        toast.success("Review added successfully!");
        setRating(0);
        setComment("");
        onReviewAdded();
      } else {
        toast.error(data.message || "Failed to add review");
      }
    } catch (error) {
      console.error("Error adding review:", error);
      toast.error("Failed to add review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
    >
      <h3 className="font-semibold text-foreground mb-3">Write a Review</h3>
      
      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-4">
        <span className="text-sm text-muted-foreground mr-2">Your rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoverRating || rating)
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment Input */}
      <Textarea
        placeholder="Share your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-4 min-h-[100px] resize-none"
        maxLength={500}
      />

      {/* Character count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {comment.length}/500 characters
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0 || !comment.trim()}
          className="gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </motion.div>
  );
};

export default AddReviewForm;
