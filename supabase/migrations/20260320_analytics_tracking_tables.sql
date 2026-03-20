-- Create post_tracking_metadata table for analytics collection scheduling
CREATE TABLE public.post_tracking_metadata (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL UNIQUE,
  last_collected_at timestamp with time zone,
  next_collection_at timestamp with time zone NOT NULL DEFAULT now(),
  current_interval text NOT NULL DEFAULT 'hourly' CHECK (
    current_interval = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text, 'monthly'::text])
  ),
  collection_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_tracking_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT post_tracking_metadata_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE
);

-- Create post_analytics_history table to track analytics over time
CREATE TABLE public.post_analytics_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  total_time_watched integer DEFAULT 0,
  average_time_watched numeric DEFAULT 0,
  new_followers integer DEFAULT 0,
  collection_count integer NOT NULL DEFAULT 0,
  current_interval text DEFAULT 'hourly',
  collected_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_analytics_history_pkey PRIMARY KEY (id),
  CONSTRAINT post_analytics_history_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_analytics_history_unique_collection UNIQUE (post_id, collection_count)
);

-- Update post_analytics table to include missing fields needed for detailed tracking
ALTER TABLE public.post_analytics
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_watched integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_time_watched numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_followers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_post_tracking_metadata_next_collection 
  ON public.post_tracking_metadata(next_collection_at);

CREATE INDEX IF NOT EXISTS idx_post_analytics_history_post_id 
  ON public.post_analytics_history(post_id, collection_count);

CREATE INDEX IF NOT EXISTS idx_post_analytics_history_collected_at 
  ON public.post_analytics_history(collected_at);

-- Grant appropriate permissions 
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tracking_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_analytics_history TO authenticated;
