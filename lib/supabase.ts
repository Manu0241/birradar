import { createClient } from '@supabase/supabase-js'

// Aquí leemos las llaves secretas que guardaste en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Creamos el "puente" y lo exportamos para usarlo en toda la web
export const supabase = createClient(supabaseUrl, supabaseKey)