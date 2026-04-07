import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
export const getSupabase = () => createServerComponentClient({ cookies });
