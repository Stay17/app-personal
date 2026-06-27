import { createClient } from '@supabase/supabase-js';

// Reemplaza estas dos líneas con TUS datos de Supabase
const supabaseUrl = 'https://wzasisdeaxlncqgpulnr.supabase.co';
const supabaseKey = 'sb_publishable_SbXstAlC-3rv3-vLev4-uA_i8pgHLfG';

export const supabase = createClient(supabaseUrl, supabaseKey);