import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://nofxdupsozycgyrdhtvz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_TILAfR7TWYoXp6lGSPtDdA_CXk9BTSm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Role = 'user' | 'company';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export type Listing = {
  id: string;
  company_id: string;
  title: string;
  description: string;
  category_id: string | null;
  location: string;
  employment_type: string;
  salary_range: string | null;
  status: 'open' | 'closed';
  created_at: string;
  categories?: Category | null;
  companies?: {
    org_name: string;
    description: string | null;
    logo_url: string | null;
    is_verified: boolean;
    website: string | null;
  } | null;
};

export type Application = {
  id: string;
  listing_id: string;
  user_id: string;
  cv_url: string | null;
  cover_letter_url: string | null;
  cover_letter_text: string | null;
  status: ApplicationStatus;
  feedback_message: string | null;
  created_at: string;
  updated_at: string;
  listings?: Listing | null;
  profiles?: Profile | null;
  interviews?: Interview[] | null;
};

export type Interview = {
  id: string;
  application_id: string;
  scheduled_at: string;
  location_or_link: string;
  notes: string | null;
  created_at: string;
};
