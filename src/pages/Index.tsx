import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Crown } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import ContestantCard from "@/components/ContestantCard";
import AddContestantDialog from "@/components/AddContestantDialog";
import heroBanner from "@/assets/hero-banner.jpg";
import { toast } from "sonner";

interface Contestant {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  vote_count: number;
}

interface Vote {
  contestant_id: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [vote, setVote] = useState<Vote | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkAdmin(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkAdmin = async (userId: string) => {
    console.log(userId)
      try {
      const { data } = await supabase
        .from("user_roles")
        .select("role, user_id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      console.log("admin?", data);
      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch contestants
      const { data: contestantsData, error: contestantsError } = await supabase
        .from("contestants")
        .select("*")
        .order("vote_count", { ascending: false });

      if (contestantsError) throw contestantsError;
      setContestants(contestantsData || []);

      // Fetch user's vote
      if (user) {
        const { data: voteData } = await supabase
          .from("votes")
          .select("contestant_id")
          .eq("user_id", user.id)
          .single();

        setVote(voteData);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthForm onSuccess={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <img
          src={heroBanner}
          alt="Costume Contest"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
            Costume Contest Voting
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
            Vote for the best costume!
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--gradient-secondary)] rounded-full text-secondary-foreground">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Admin</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {isAdmin && <AddContestantDialog onSuccess={fetchData} />}
            <Button onClick={handleSignOut} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading contestants...</p>
          </div>
        ) : contestants.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">No Contestants Yet</h2>
            <p className="text-muted-foreground">
              {isAdmin ? "Add the first contestant to get started!" : "Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {contestants.map((contestant) => (
              <ContestantCard
                key={contestant.id}
                id={contestant.id}
                name={contestant.name}
                description={contestant.description}
                imageUrl={contestant.image_url}
                voteCount={contestant.vote_count}
                hasVoted={!!vote}
                userVotedFor={vote?.contestant_id || null}
                onVoteSuccess={fetchData}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
