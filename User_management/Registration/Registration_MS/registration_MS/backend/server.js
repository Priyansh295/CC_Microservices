// server.js - Updated Version using Service Role Key

// 1. Load Environment Variables
require('dotenv').config(); // Loads variables from .env into process.env

// 2. Import Dependencies
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// 3. Initialize Express App
const app = express();
const port = process.env.PORT || 3001;

// 4. Initialize Supabase Clients (Public and Admin)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // <-- Get service key from .env

// Check if all required keys are present
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error("Error: Make sure SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY are set in your .env file");
    process.exit(1); // Stop the server if keys are missing
}

// Client for public/auth operations (using ANON key)
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("Supabase public client initialized.");

// Client for backend admin operations (using SERVICE ROLE key) - BYPASSES RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    // Recommended options for server-side admin clients
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
console.log("Supabase admin client initialized.");
// --- End Client Initialization ---

// 5. Apply Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Enable JSON body parsing

// 6. Define Routes

// --- Health Check Route --- (Using public client is sufficient)
app.get('/health', (req, res) => {
     if (supabase) {
        res.status(200).json({ status: 'OK', supabase: 'connected' });
     } else {
        res.status(500).json({ status: 'Error', supabase: 'disconnected' });
     }
});

// --- Registration Route ---
app.post('/register', async (req, res) => {
    // 1. Extract data from request body
    const {
        email, password, firstName, lastName, dob, phoneNumber, address,
        major, enrolledCourses, // Expecting array from frontend's parsing
        academicYear, previousEducation
    } = req.body;

    // 2. Basic Input Validation
    if (!email || !password || !firstName || !lastName /* add other required fields */) {
        return res.status(400).json({ error: 'Missing required fields. Please provide email, password, first name, and last name.' });
    }

    try {
        // 3. Step 1: Create the user in Supabase Auth using the PUBLIC client
        console.log(`Attempting to sign up user: ${email}`);
        const { data: authData, error: authError } = await supabase.auth.signUp({ // Use public client
            email: email,
            password: password
        });

        if (authError) {
            console.error(`Supabase Auth Error for ${email}:`, authError.message);
            let errorMessage = 'Authentication failed during registration.';
             if (authError.message.includes('User already registered')) {
                errorMessage = 'This email is already registered.';
             } else if (authError.message.includes('Password should be')) {
                 errorMessage = authError.message;
             }
            return res.status(400).json({ error: errorMessage });
        }

        // If auth succeeded
        const userId = authData.user.id;
        console.log(`User ${email} created successfully in Auth. User ID: ${userId}`);

        // 4. Step 2: Insert the profile using the ADMIN client (bypasses RLS)
        console.log(`Attempting to insert profile for User ID: ${userId} using ADMIN client`);
        // Use supabaseAdmin for this database operation
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userId, // Link to the auth user
                first_name: firstName,
                last_name: lastName,
                date_of_birth: dob,
                phone_number: phoneNumber,
                address: address,
                major: major,
                enrolled_courses: enrolledCourses, // Should be an array
                academic_year: academicYear,
                previous_education: previousEducation,
                email: email // Store email here too
            });

        // Check for profile insertion error
        if (profileError) {
            // This error is now less likely RLS, more likely data type/constraints
            console.error(`Supabase Profile Insert Error (Admin) for User ID ${userId}:`, profileError.message);
            return res.status(500).json({
                 error: 'User account created, but failed to save profile details (Admin Insert). Please contact support.',
                 details: profileError.message
             });
        }

        console.log(`Profile for User ID ${userId} created successfully (Admin Insert).`);

        // 5. Return Success Response
        res.status(201).json({ message: 'Registration successful! Profile created.' });

    } catch (error) {
        // Catch any unexpected errors
        console.error('Unexpected error during /register:', error);
        res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
    }
});
// End of Registration Route


// 7. Start the Server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});