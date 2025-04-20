// src/components/RegisterForm.jsx - Updated with MUI Components

import React, { useState } from 'react';
import axios from 'axios';

// --- Import MUI Components ---
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText'; // For hints

function RegisterForm() {
  // === State Variables (remain the same) ===
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState(''); // Date of Birth
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [major, setMajor] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [previousEducation, setPreviousEducation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // === Handler for Form Submission (remains the same logic) ===
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const coursesArray = enrolledCourses
      .split(',')
      .map(course => course.trim())
      .filter(course => course !== '');

    const formData = {
      email, password, firstName, lastName, dob, phoneNumber, address,
      major, enrolledCourses: coursesArray, academicYear, previousEducation
    };
        // Inside handleSubmit, right before the try block:
    const backendUrl = `${import.meta.env.VITE_BACKEND_API_URL}/register`;
    console.log(`>>> Attempting API call to: ${backendUrl}`); // <-- THIS LINE
    if (!import.meta.env.VITE_BACKEND_API_URL) { /* ... */ }

    try {
      // Read backend URL from environment variable (Vite exposes VITE_ vars)
      const backendUrl = `${import.meta.env.VITE_BACKEND_API_URL}/register`;
      // Add basic check/fallback (optional but good practice)
      if (!import.meta.env.VITE_BACKEND_API_URL) {
          console.error("Error: VITE_BACKEND_API_URL environment variable not set!");
          setError("Frontend configuration error: Backend URL not set.");
          return; // Stop submission if URL is missing
      }
      console.log('Sending registration data to backend:', formData);
      const response = await axios.post(backendUrl, formData);
      console.log('Backend Response:', response.data);

      setMessage(response.data.message || 'Registration successful!');
      // Clear form
      setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setDob('');
      setPhoneNumber(''); setAddress(''); setMajor(''); setEnrolledCourses('');
      setAcademicYear(''); setPreviousEducation('');

    } catch (err) {
      console.error("Registration API Error:", err);
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  // === JSX Structure using MUI Components ===
  return (
    <Container component="main" maxWidth="sm"> {/* Centered container with max width */}
      <Box
        sx={{
          marginTop: 8, // Add some margin top
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5"> {/* Form Title */}
          Register for Virtual Lab
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}> {/* Form element */}

          {/* Email */}
          <TextField
            margin="normal" // Adds top/bottom margin
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus // Focus this field first
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error && error.toLowerCase().includes('email')} // Basic error highlight example
          />

          {/* Password */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputProps={{ minLength: 6 }} // Example for minLength
            error={!!error && error.toLowerCase().includes('password')}
          />

          {/* First Name */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          {/* Last Name */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="lastName"
            label="Last Name"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          {/* Date of Birth */}
          <TextField
            margin="normal"
            fullWidth // Required makes label shrink correctly for date/tel
            id="dob"
            label="Date of Birth"
            name="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            InputLabelProps={{ // Important for date/time types
              shrink: true,
            }}
            // required
          />

          {/* Phone Number */}
          <TextField
            margin="normal"
            fullWidth
            id="phoneNumber"
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            InputLabelProps={{ // Often needed for type=tel too
              shrink: true,
            }}
            // required
          />

          {/* Address */}
          <TextField
            margin="normal"
            fullWidth
            id="address"
            label="Address"
            name="address"
            multiline // Make it a textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            // required
          />

          {/* Major */}
          <TextField
            margin="normal"
            fullWidth
            id="major"
            label="Major"
            name="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            // required
          />

          {/* Enrolled Courses */}
          <TextField
            margin="normal"
            fullWidth
            id="enrolledCourses"
            label="Enrolled Courses"
            name="enrolledCourses"
            value={enrolledCourses}
            onChange={(e) => setEnrolledCourses(e.target.value)}
            // required
          />
           <FormHelperText>Please separate course codes or names with a comma (e.g., CS101, MA201).</FormHelperText>


          {/* Academic Year */}
          <TextField
            margin="normal"
            fullWidth
            id="academicYear"
            label="Academic Year"
            name="academicYear"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            // required
          />

          {/* Previous Education */}
          <TextField
            margin="normal"
            fullWidth
            id="previousEducation"
            label="Previous Education"
            name="previousEducation"
            multiline
            rows={3}
            value={previousEducation}
            onChange={(e) => setPreviousEducation(e.target.value)}
            // required
          />

          {/* Feedback Messages using Alert component */}
          {message && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained" // Gives it background color and elevation
            sx={{ mt: 3, mb: 2 }} // Add margin top/bottom using sx prop
          >
            Register
          </Button>

        </Box>
      </Box>
    </Container>
  );
}

export default RegisterForm;