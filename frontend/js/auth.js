// Login handler
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
  
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageBox = document.getElementById('formMessage');
    messageBox.textContent = '';
    messageBox.style.display = 'none';

    console.log('Attempting login...');
    fetch('../backend/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Login response:', data);
        if (data.success) {
            // Store minimal user data in sessionStorage
            sessionStorage.setItem('user', JSON.stringify({
                name: data.user.name,
                email: data.user.email,
                role: data.user.role
            }));
            
            // Redirect based on role
            switch(data.user.role) {
                case 'student':
                    window.location.href = 'dashboard_student.html';
                    break;
                case 'lecturer':
                    window.location.href = 'lecturer_dashboard.html';
                    break;
                case 'admin':
                    window.location.href = 'admin_dashboard.html';
                    break;
                default:
                    window.location.href = 'index.html';
            }
        } else {
            messageBox.textContent = data.message || 'Login failed';
            messageBox.style.display = 'block';
            messageBox.style.color = 'red';
        }
    })
    .catch(err => {
        console.error('Login error:', err);
        messageBox.textContent = err.message || "Login service unavailable. Please try again later.";
        messageBox.style.display = 'block';
        messageBox.style.color = 'red';
    });
});

// Registration handler
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;
    const course = document.getElementById('course')?.value || '';
    const messageBox = document.getElementById('formMessage');
    messageBox.textContent = '';
    messageBox.style.display = 'none';
    
    fetch('../backend/register.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role, course }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        messageBox.textContent = data.message;
        messageBox.style.display = 'block';
        
        if (data.success) {
            messageBox.style.color = 'green';
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            messageBox.style.color = 'red';
        }
    })
    .catch(err => {
        console.error('Registration error:', err);
        messageBox.textContent = err.message || "Registration service unavailable. Please try again later.";
        messageBox.style.display = 'block';
        messageBox.style.color = 'red';
    });
});

// Password reset handler
document.getElementById('resetPasswordForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const messageBox = document.getElementById('formMessage');
    messageBox.textContent = '';
    messageBox.style.display = 'none';

    fetch('../backend/reset_password.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ email, new_password: newPassword }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        messageBox.textContent = data.message;
        messageBox.style.display = 'block';
        
        if (data.success) {
            messageBox.style.color = 'green';
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            messageBox.style.color = 'red';
        }
    })
    .catch(err => {
        console.error('Password reset error:', err);
        messageBox.textContent = err.message || "Password reset service unavailable. Please try again later.";
        messageBox.style.display = 'block';
        messageBox.style.color = 'red';
    });
});