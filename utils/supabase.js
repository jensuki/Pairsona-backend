'use strict';

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/** use supabase bucket for user profile image data */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// create client with supabase url and key
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
