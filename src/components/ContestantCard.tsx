import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trophy, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContestantCardProps {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  voteCount: number;
  hasVoted: boolean;
  userVotedFor: string | null;
  onVoteSuccess: () => void;
  isAdmin: boolean;
}

export default function ContestantCard({
  id,
  name,
  description,
  imageUrl,
  voteCount,
  hasVoted,
  userVotedFor,
  onVoteSuccess,
  isAdmin,
}: ContestantCardProps) {
  const [voting, setVoting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const isVotedFor = userVotedFor === id;

  const handleVote = async () => {
    setVoting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to vote");
        return;
      }

      if (hasVoted && !isVotedFor) {
        // Update existing vote
        const { error } = await supabase
          .from("votes")
          .update({ contestant_id: id })
          .eq("user_id", user.id);
        
        if (error) throw error;
        toast.success("Vote changed!");
      } else if (!hasVoted) {
        // Insert new vote
        const { error } = await supabase
          .from("votes")
          .insert({ user_id: user.id, contestant_id: id });
        
        if (error) throw error;
        toast.success("Vote cast!");
      }
      
      onVoteSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contestant?")) return;
    
    try {
      const { error } = await supabase
        .from("contestants")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Contestant deleted");
      onVoteSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:-translate-y-1">
        <div 
          className="relative h-64 overflow-hidden bg-muted cursor-pointer"
          onClick={() => imageUrl && setShowImageModal(true)}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--gradient-primary)]">
              <Trophy className="w-16 h-16 text-primary-foreground opacity-50" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive fill-destructive" />
            <span className="font-bold">{voteCount}</span>
          </div>
        </div>
      <CardContent className="p-5">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        {description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleVote}
            disabled={voting || isVotedFor}
            className="flex-1"
            variant={isVotedFor ? "secondary" : "default"}
          >
            {voting ? "Voting..." : isVotedFor ? "Your Vote" : hasVoted ? "Change Vote" : "Vote"}
          </Button>
          {isAdmin && (
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="icon"
            >
              ×
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <img
          src={imageUrl || ''}
          alt={name}
          className="w-full h-auto"
        />
      </DialogContent>
    </Dialog>
    </>
  );
}
