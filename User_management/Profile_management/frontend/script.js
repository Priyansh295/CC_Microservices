const API_BASE_URL = '/api'; // Backend API base URL

async function getProfile() {
    const userId = document.getElementById('user-id').value;
    if (!userId) {
        alert('Please enter a User ID.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/profiles/${userId}`);
        if (response.ok) {
            const data = await response.json();
            console.log("Data fetched:", data); // Check the fetched data
            if (data.message === "Profile not found") {
                alert("Profile not found for this User ID.");
                document.getElementById('profile-details').style.display = 'none';
            } else {
                document.getElementById('display-user-id').textContent = data.user_id;
                document.getElementById('display-first-name').textContent = data.first_name || '';
                document.getElementById('display-last-name').textContent = data.last_name || '';
                const dob = data.date_of_birth;
                const academicYear = data.academic_year;
                console.log("Date of Birth received:", dob); // Log DOB value
                console.log("Academic Year received:", academicYear); // Log Academic Year value
                document.getElementById('display-date-of-birth').textContent = dob || '';
                document.getElementById('display-phone-number').textContent = data.phone_number || '';
                document.getElementById('display-address').textContent = data.address || '';
                document.getElementById('display-major').textContent = data.major || '';
                document.getElementById('display-enrolled-courses').textContent = data.enrolled_courses ? data.enrolled_courses.join(', ') : '';
                document.getElementById('display-academic-year').textContent = academicYear || '';
                document.getElementById('display-previous-education').textContent = data.previous_education || '';
                document.getElementById('profile-details').style.display = 'block';

                // Update checkboxes based on fetched data
                document.getElementById('os').checked = data.enrolled_courses && data.enrolled_courses.includes('OS');
                document.getElementById('dsa').checked = data.enrolled_courses && data.enrolled_courses.includes('DSA');
                document.getElementById('se').checked = data.enrolled_courses && data.enrolled_courses.includes('SE');
            }
        } else {
            const error = await response.json();
            alert(`Error fetching profile: ${error.message || response.statusText}`);
            document.getElementById('profile-details').style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Failed to fetch profile.');
        document.getElementById('profile-details').style.display = 'none';
    }
}

async function createOrUpdateProfile() {
    const userId = document.getElementById('user-id').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const dateOfBirth = document.getElementById('date-of-birth').value;
    const phoneNumber = document.getElementById('phone-number').value;
    const address = document.getElementById('address').value;
    const major = document.getElementById('major').value;
    const enrolledCourses = [];
    if (document.getElementById('os').checked) enrolledCourses.push('OS');
    if (document.getElementById('dsa').checked) enrolledCourses.push('DSA');
    if (document.getElementById('se').checked) enrolledCourses.push('SE');
    const academicYear = document.getElementById('academic-year').value;
    const previousEducation = document.getElementById('previous-education').value;

    if (!userId) {
        alert('Please enter a User ID.');
        return;
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('date-of-birth', dateOfBirth);
    formData.append('phone_number', phoneNumber);
    formData.append('address', address);
    formData.append('major', major);
    formData.append('enrolled_courses', enrolledCourses); // Send as is
    formData.append('academic-year', academicYear);
    formData.append('previous-education', previousEducation);

    try {
        const existingProfileResponse = await fetch(`${API_BASE_URL}/profiles/${userId}`);
        const method = existingProfileResponse.ok ? 'PUT' : 'POST';
        const url = `${API_BASE_URL}/profiles${method === 'PUT' ? `/${userId}` : ''}`;

        const response = await fetch(url, {
            method: method,
            body: formData // Send FormData
        });

        const result = await response.json();
        alert(result.message);
        if (response.ok) {
            getProfile(); // Refresh the displayed profile
        }
    } catch (error) {
        console.error('Error creating/updating profile:', error);
        alert('Failed to create/update profile.');
    }
}