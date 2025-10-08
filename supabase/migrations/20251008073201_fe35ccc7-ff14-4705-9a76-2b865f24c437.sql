-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create contestants table
CREATE TABLE public.contestants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  vote_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on contestants
ALTER TABLE public.contestants ENABLE ROW LEVEL SECURITY;

-- Everyone can view contestants
CREATE POLICY "Anyone can view contestants"
  ON public.contestants
  FOR SELECT
  USING (true);

-- Only admins can insert contestants
CREATE POLICY "Admins can insert contestants"
  ON public.contestants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update contestants
CREATE POLICY "Admins can update contestants"
  ON public.contestants
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete contestants
CREATE POLICY "Admins can delete contestants"
  ON public.contestants
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create votes table
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contestant_id uuid REFERENCES public.contestants(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Users can view their own votes
CREATE POLICY "Users can view their own votes"
  ON public.votes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own vote (only one)
CREATE POLICY "Users can insert their own vote"
  ON public.votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vote
CREATE POLICY "Users can update their own vote"
  ON public.votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update vote count when vote is added
CREATE OR REPLACE FUNCTION public.increment_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contestants
  SET vote_count = vote_count + 1
  WHERE id = NEW.contestant_id;
  RETURN NEW;
END;
$$;

-- Function to update vote count when vote is changed
CREATE OR REPLACE FUNCTION public.update_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease old contestant's count
  UPDATE public.contestants
  SET vote_count = vote_count - 1
  WHERE id = OLD.contestant_id;
  
  -- Increase new contestant's count
  UPDATE public.contestants
  SET vote_count = vote_count + 1
  WHERE id = NEW.contestant_id;
  
  RETURN NEW;
END;
$$;

-- Function to update vote count when vote is deleted
CREATE OR REPLACE FUNCTION public.decrement_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contestants
  SET vote_count = vote_count - 1
  WHERE id = OLD.contestant_id;
  RETURN OLD;
END;
$$;

-- Create triggers for vote counting
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_vote_count();

CREATE TRIGGER on_vote_update
  AFTER UPDATE ON public.votes
  FOR EACH ROW
  WHEN (OLD.contestant_id IS DISTINCT FROM NEW.contestant_id)
  EXECUTE FUNCTION public.update_vote_count();

CREATE TRIGGER on_vote_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_vote_count();