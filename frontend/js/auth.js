// Role selector functionality
document.querySelectorAll('.role-btn')?.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        // Update hidden role input
        document.getElementById('role').value = this.dataset.role;
    });
});

// Password visibility toggle
document.querySelector('.toggle-password')?.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

// Login handler
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
  
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;
    const submitBtn = this.querySelector('.submit-btn');
    const messageBox = document.getElementById('formMessage');
    
    // Clear previous messages
    messageBox.textContent = '';
    messageBox.style.display = 'none';
    messageBox.classList.remove('error', 'success');

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<i class="fas fa-spinner"></i> Logging in...';

    console.log('Attempting login...');
    fetch('../backend/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password, role }),
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
            // Show success message
            messageBox.textContent = 'Login successful! Redirecting...';
            messageBox.classList.add('success');
            messageBox.style.display = 'block';

            // Store minimal user data in sessionStorage
            const userData = {
                name: data.user.name,
                email: data.user.email,
                role: data.user.role
            };
            console.log('User data being stored:', userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
            
            // Redirect based on role after a short delay
            console.log('Redirecting user with role:', data.user.role);
            setTimeout(() => {
                switch(data.user.role) {
                    case 'student':
                        console.log('Redirecting to student dashboard');
                        window.location.href = 'dashboard_student.html';
                        break;
                    case 'lecturer':
                        console.log('Redirecting to lecturer dashboard');
                        window.location.href = 'lecturer_dashboard.html';
                        break;
                    case 'admin':
                        console.log('Redirecting to admin dashboard');
                        window.location.href = 'admin_dashboard.html';
                        break;
                    default:
                        console.log('Unknown role, redirecting to index');
                        window.location.href = 'index.html';
                }
            }, 1000);
        } else {
            throw new Error(data.message || 'Login failed');
        }
    })
    .catch(err => {
        console.error('Login error:', err);
        messageBox.textContent = err.message || "Login service unavailable. Please try again later.";
        messageBox.classList.add('error');
        messageBox.style.display = 'block';
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
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
    const submitBtn = this.querySelector('button[type="submit"]');
    const messageBox = document.getElementById('formMessage');
    
    // Clear previous messages
    messageBox.textContent = '';
    messageBox.style.display = 'none';
    messageBox.classList.remove('error', 'success');

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<i class="fas fa-spinner"></i> Registering...';
    
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
        messageBox.classList.add(data.success ? 'success' : 'error');
        messageBox.style.display = 'block';
        
        if (data.success) {
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = 'Register';
        }
    })
    .catch(err => {
        console.error('Registration error:', err);
        messageBox.textContent = err.message || "Registration service unavailable. Please try again later.";
        messageBox.classList.add('error');
        messageBox.style.display = 'block';
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = 'Register';
    });
});

// Password reset handler
document.getElementById('resetPasswordForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const submitBtn = this.querySelector('button[type="submit"]');
    const messageBox = document.getElementById('formMessage');
    
    // Clear previous messages
    messageBox.textContent = '';
    messageBox.style.display = 'none';
    messageBox.classList.remove('error', 'success');

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<i class="fas fa-spinner"></i> Resetting...';

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
        messageBox.classList.add(data.success ? 'success' : 'error');
        messageBox.style.display = 'block';
        
        if (data.success) {
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = 'Reset Password';
        }
    })
    .catch(err => {
        console.error('Password reset error:', err);
        messageBox.textContent = err.message || "Password reset service unavailable. Please try again later.";
        messageBox.classList.add('error');
        messageBox.style.display = 'block';
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = 'Reset Password';
    });
});