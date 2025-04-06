document.addEventListener('DOMContentLoaded', function() {
    const BASE_URL = '/sis-master/backend/';
    const user = JSON.parse(sessionStorage.getItem('user'));

    // Redirect if not logged in
    if (!user || user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    // Load user data
    loadUserData();

    // Setup form event listeners
    document.getElementById('emailForm').addEventListener('submit', handleEmailUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordUpdate);

    async function loadUserData() {
        try {
            const response = await fetch(BASE_URL + 'get_student_profile.php', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Failed to load user data');
            }

            const data = result.data;

            // Update profile information
            document.getElementById('studentId').textContent = data.student_id || 'N/A';
            document.getElementById('fullName').textContent = data.name || 'N/A';
            document.getElementById('course').textContent = data.course || 'N/A';
            document.getElementById('currentEmail').value = data.email || '';

        } catch (error) {
            showError('Failed to load user data: ' + error.message);
        }
    }

    async function handleEmailUpdate(event) {
        event.preventDefault();
        
        const newEmail = document.getElementById('newEmail').value;
        const password = document.getElementById('emailPassword').value;

        try {
            const response = await fetch(BASE_URL + 'update_email.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    new_email: newEmail,
                    password: password
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            showSuccess('Email updated successfully');
            document.getElementById('currentEmail').value = newEmail;
            document.getElementById('newEmail').value = '';
            document.getElementById('emailPassword').value = '';

        } catch (error) {
            showError('Failed to update email: ' + error.message);
        }
    }

    async function handlePasswordUpdate(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate password requirements
        if (!validatePassword(newPassword)) {
            showError('Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters');
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            showError('New passwords do not match');
            return;
        }

        try {
            const response = await fetch(BASE_URL + 'update_password.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            showSuccess('Password updated successfully');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';

        } catch (error) {
            showError('Failed to update password: ' + error.message);
        }
    }

    function validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && 
               hasUpperCase && 
               hasLowerCase && 
               hasNumbers && 
               hasSpecialChar;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.textContent = message;
        
        // Remove any existing messages
        removeMessages();
        
        // Add the new message
        document.querySelector('.settings-header').insertAdjacentElement('afterend', errorDiv);
        
        // Remove the message after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'message success';
        successDiv.textContent = message;
        
        // Remove any existing messages
        removeMessages();
        
        // Add the new message
        document.querySelector('.settings-header').insertAdjacentElement('afterend', successDiv);
        
        // Remove the message after 5 seconds
        setTimeout(() => successDiv.remove(), 5000);
    }

    function removeMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => message.remove());
    }
}); 