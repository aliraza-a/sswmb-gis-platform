+-- 1. Create supervisors table
CREATE TABLE IF NOT EXISTS public.supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  uc_id UUID REFERENCES public.uc(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create shift_logs table
CREATE TABLE IF NOT EXISTS public.shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES public.supervisors(id) ON DELETE CASCADE,
  uc_id UUID REFERENCES public.uc(id),
  vehicle_id UUID REFERENCES public.vehicle(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration TEXT, -- Optional, could be calculated on the fly or stored as string like "02:14:33"
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete', 'cancelled')),
  start_image_url TEXT,
  end_image_url TEXT,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create shift_alerts table
CREATE TABLE IF NOT EXISTS public.shift_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.shift_logs(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'missing_end', 'invalid_vehicle', etc.
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. Enable RLS
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_alerts ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Assuming basic auth or allowing public API key for now. You might want to lock this down to authenticated users in a real prod env)
-- For this prototype, allowing read/write if they have the anon key. 
-- IN PRODUCTION: Restrict to authenticated admin users, or specific supervisors via an auth table.
CREATE POLICY "Allow all operations for anon" ON public.supervisors FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON public.shift_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON public.shift_alerts FOR ALL USING (true);

-- 6. Storage Bucket for shifts
INSERT INTO storage.buckets (id, name, public) VALUES ('shifts', 'shifts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Allow public uploads to shifts bucket"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'shifts' );

CREATE POLICY "Allow public viewing of shifts bucket"
ON storage.objects FOR SELECT
USING ( bucket_id = 'shifts' );
