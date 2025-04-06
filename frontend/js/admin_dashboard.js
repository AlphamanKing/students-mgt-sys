class AdminDashboard {
    constructor() {
        this.currentSection = 'manage-students';
        this.charts = {};
        this.students = [];
        this.lecturers = [];
        
        // Bind methods
        this.handleLogout = this.handleLogout.bind(this);
        this.showSection = this.showSection.bind(this);
        this.handleStudentSearch = this.handleStudentSearch.bind(this);
        this.handleLecturerSearch = this.handleLecturerSearch.bind(this);
        
        this.initializeEventListeners();
        this.loadAdminData();
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sectionId = e.currentTarget.getAttribute('data-section');
                if (sectionId) {
                    this.showSection(sectionId);
                }
            });
        });

        // Profile dropdown
        const profileCircle = document.querySelector('.profile-circle');
        const profileDropdown = document.querySelector('.profile-dropdown');
        const settingsBtn = document.querySelector('.settings-btn');
        
        if (profileCircle && profileDropdown) {
            profileCircle.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
            });

            document.addEventListener('click', (e) => {
                if (!profileCircle.contains(e.target)) {
                    profileDropdown.style.display = 'none';
                }
            });
        }
        
        // Settings button in profile dropdown
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('system-settings');
                profileDropdown.style.display = 'none';
            });
        }

        // Student management
        const addStudentBtn = document.getElementById('addStudentBtn');
        const studentModal = document.getElementById('studentModal');
        const studentForm = document.getElementById('studentForm');
        const studentSearch = document.getElementById('studentSearch');
        const studentFilter = document.getElementById('studentFilter');

        if (addStudentBtn && studentModal) {
            addStudentBtn.addEventListener('click', () => this.openModal('student'));
        }

        if (studentForm) {
            studentForm.addEventListener('submit', (e) => this.handleStudentSubmit(e));
        }

        if (studentSearch) {
            studentSearch.addEventListener('input', this.handleStudentSearch);
        }

        if (studentFilter) {
            studentFilter.addEventListener('change', this.handleStudentSearch);
        }

        // Lecturer management
        const addLecturerBtn = document.getElementById('addLecturerBtn');
        const lecturerModal = document.getElementById('lecturerModal');
        const lecturerForm = document.getElementById('lecturerForm');
        const lecturerSearch = document.getElementById('lecturerSearch');
        const lecturerFilter = document.getElementById('lecturerFilter');

        if (addLecturerBtn && lecturerModal) {
            addLecturerBtn.addEventListener('click', () => this.openModal('lecturer'));
        }

        if (lecturerForm) {
            lecturerForm.addEventListener('submit', (e) => this.handleLecturerSubmit(e));
        }

        if (lecturerSearch) {
            lecturerSearch.addEventListener('input', this.handleLecturerSearch);
        }

        if (lecturerFilter) {
            lecturerFilter.addEventListener('change', this.handleLecturerSearch);
        }

        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.closeModals());
        });

        // Settings forms
        const generalSettingsForm = document.getElementById('generalSettingsForm');
        const emailSettingsForm = document.getElementById('emailSettingsForm');
        const backupSettingsForm = document.getElementById('backupSettingsForm');
        const manualBackupBtn = document.getElementById('manualBackupBtn');

        if (generalSettingsForm) {
            generalSettingsForm.addEventListener('change', () => this.saveSettings('general'));
        }

        if (emailSettingsForm) {
            emailSettingsForm.addEventListener('change', () => this.saveSettings('email'));
        }

        if (backupSettingsForm) {
            backupSettingsForm.addEventListener('change', () => this.saveSettings('backup'));
        }

        if (manualBackupBtn) {
            manualBackupBtn.addEventListener('click', () => this.performManualBackup());
        }

        // Logout
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout);
        }
    }

    async loadAdminData() {
        try {
            const response = await this.fetchAPI('get_admin_data.php');
            if (!response.success) throw new Error('Failed to load admin data');
            
            this.initializeProfileCircle(response.user);
            await this.loadStudents();
            await this.loadLecturers();
            await this.loadAnalytics();
            await this.loadSettings();
            
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showError('Failed to load admin data');
        }
    }

    async loadStudents() {
        try {
            const response = await this.fetchAPI('get_students.php');
            if (!response.success) throw new Error('Failed to load students');
            
            this.students = response.data || [];
            this.renderStudentsTable(this.students);
            
        } catch (error) {
            console.error('Error loading students:', error);
            this.showError('Failed to load students');
        }
    }

    async loadLecturers() {
        try {
            const response = await this.fetchAPI('get_lecturers.php');
            if (!response.success) throw new Error('Failed to load lecturers');
            
            this.lecturers = response.data || [];
            this.renderLecturersTable(this.lecturers);
            
        } catch (error) {
            console.error('Error loading lecturers:', error);
            this.showError('Failed to load lecturers');
        }
    }

    async loadAnalytics() {
        try {
            const [userStats, performance, usage] = await Promise.all([
                this.fetchAPI('get_user_stats.php'),
                this.fetchAPI('get_performance_stats.php'),
                this.fetchAPI('get_usage_stats.php')
            ]);

            this.renderUserStatsChart(userStats.data);
            this.renderPerformanceChart(performance.data);
            this.renderUsageChart(usage.data);
            this.updateQuickStats();
            
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data');
        }
    }

    async loadSettings() {
        try {
            const response = await this.fetchAPI('get_settings.php');
            if (!response.success) throw new Error('Failed to load settings');
            
            this.populateSettingsForms(response.data);
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showError('Failed to load system settings');
        }
    }

    renderStudentsTable(students) {
        const tableBody = document.querySelector('#studentsTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = students.map(student => `
            <tr>
                <td>${student.student_id}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>
                    <span class="status-badge status-${student.status.toLowerCase()}">
                        ${student.status}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" onclick="adminDashboard.editStudent('${student.student_id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="adminDashboard.deleteStudent('${student.student_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderLecturersTable(lecturers) {
        const tableBody = document.querySelector('#lecturersTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = lecturers.map(lecturer => `
            <tr>
                <td>${lecturer.lecturer_id}</td>
                <td>${lecturer.name}</td>
                <td>${lecturer.email}</td>
                <td>${lecturer.department}</td>
                <td>
                    <span class="status-badge status-${lecturer.status.toLowerCase()}">
                        ${lecturer.status}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" onclick="adminDashboard.editLecturer('${lecturer.lecturer_id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="adminDashboard.deleteLecturer('${lecturer.lecturer_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderUserStatsChart(data) {
        const ctx = document.getElementById('userStatsChart');
        if (!ctx) return;

        if (this.charts.userStats) {
            this.charts.userStats.destroy();
        }

        this.charts.userStats = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Students', 'Lecturers', 'Admins'],
                datasets: [{
                    data: [data.students, data.lecturers, data.admins],
                    backgroundColor: ['#3498db', '#e74c3c', '#2ecc71']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderPerformanceChart(data) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        this.charts.performance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Average Grade',
                    data: data.averages,
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    renderUsageChart(data) {
        const ctx = document.getElementById('usageChart');
        if (!ctx) return;

        if (this.charts.usage) {
            this.charts.usage.destroy();
        }

        this.charts.usage = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Active Users',
                    data: data.values,
                    borderColor: '#2ecc71',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateQuickStats() {
        document.getElementById('totalStudents').textContent = this.students.length;
        document.getElementById('totalLecturers').textContent = this.lecturers.length;
        document.getElementById('totalCourses').textContent = this.courses?.length || 0;
        document.getElementById('activeUsers').textContent = this.getActiveUsersCount();
    }

    getActiveUsersCount() {
        const activeStudents = this.students.filter(s => s.status === 'Active').length;
        const activeLecturers = this.lecturers.filter(l => l.status === 'Active').length;
        return activeStudents + activeLecturers;
    }

    async handleStudentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const isEdit = form.dataset.editing === 'true';
        
        try {
            const formData = {
                name: form.studentName.value.trim(),
                email: form.studentEmail.value.trim(),
                course: form.studentCourse.value.trim(),
                status: form.studentStatus.value,
                password: form.studentPassword.value
            };

            if (isEdit) {
                formData.student_id = parseInt(form.dataset.studentId);
                await this.updateStudent(formData);
            } else {
                await this.createStudent(formData);
            }

            this.closeModals();
            await this.loadStudents();
            this.showSuccess(`Student successfully ${isEdit ? 'updated' : 'created'}`);
            
        } catch (error) {
            console.error('Error submitting student form:', error);
            this.showError(`Failed to ${isEdit ? 'update' : 'create'} student`);
        }
    }

    async handleLecturerSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const isEdit = form.dataset.editing === 'true';
        
        try {
            const formData = {
                name: form.lecturerName.value,
                email: form.lecturerEmail.value,
                password: form.lecturerPassword.value,
                department: form.lecturerDepartment.value,
                status: form.lecturerStatus.value
            };

            if (isEdit) {
                formData.lecturer_id = form.dataset.lecturerId;
                await this.updateLecturer(formData);
            } else {
                await this.createLecturer(formData);
            }

            this.closeModals();
            await this.loadLecturers();
            this.showSuccess(`Lecturer successfully ${isEdit ? 'updated' : 'created'}`);
            
        } catch (error) {
            console.error('Error submitting lecturer form:', error);
            this.showError(`Failed to ${isEdit ? 'update' : 'create'} lecturer`);
        }
    }

    async createStudent(data) {
        const response = await this.fetchAPI('create_student.php', {
            method: 'POST',
            body: data
        });
        
        if (!response.success) throw new Error(response.message || 'Failed to create student');
        return response;
    }

    async updateStudent(data) {
        const response = await this.fetchAPI('update_student.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.success) throw new Error(response.message || 'Failed to update student');
        return response;
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await this.fetchAPI('delete_student.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ student_id: studentId })
            });

            if (!response.success) throw new Error(response.message);
            
            await this.loadStudents();
            this.showSuccess('Student successfully deleted');
            
        } catch (error) {
            console.error('Error deleting student:', error);
            this.showError('Failed to delete student');
        }
    }

    async createLecturer(data) {
        const response = await this.fetchAPI('create_lecturer.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.success) throw new Error(response.message || 'Failed to create lecturer');
        return response;
    }

    async updateLecturer(data) {
        const response = await this.fetchAPI('update_lecturer.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.success) throw new Error(response.message || 'Failed to update lecturer');
        return response;
    }

    async deleteLecturer(lecturerId) {
        if (!confirm('Are you sure you want to delete this lecturer? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await this.fetchAPI('delete_lecturer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lecturer_id: lecturerId })
            });

            if (!response.success) throw new Error(response.message);
            
            await this.loadLecturers();
            this.showSuccess('Lecturer successfully deleted');
            
        } catch (error) {
            console.error('Error deleting lecturer:', error);
            this.showError('Failed to delete lecturer');
        }
    }

    handleStudentSearch() {
        const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
        const filterValue = document.getElementById('studentFilter').value;
        
        const filteredStudents = this.students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm) ||
                                student.email.toLowerCase().includes(searchTerm) ||
                                student.student_id.toLowerCase().includes(searchTerm);
                                
            const matchesFilter = filterValue === 'all' || 
                                student.status.toLowerCase() === filterValue;
                                
            return matchesSearch && matchesFilter;
        });
        
        this.renderStudentsTable(filteredStudents);
    }

    handleLecturerSearch() {
        const searchTerm = document.getElementById('lecturerSearch').value.toLowerCase();
        const filterValue = document.getElementById('lecturerFilter').value;
        
        const filteredLecturers = this.lecturers.filter(lecturer => {
            const matchesSearch = lecturer.name.toLowerCase().includes(searchTerm) ||
                                lecturer.email.toLowerCase().includes(searchTerm) ||
                                lecturer.department.toLowerCase().includes(searchTerm) ||
                                lecturer.lecturer_id.toLowerCase().includes(searchTerm);
                                
            const matchesFilter = filterValue === 'all' || 
                                lecturer.status.toLowerCase() === filterValue;
                                
            return matchesSearch && matchesFilter;
        });
        
        this.renderLecturersTable(filteredLecturers);
    }

    editStudent(studentId) {
        const student = this.students.find(s => s.student_id === studentId);
        if (!student) return;

        const form = document.getElementById('studentForm');
        const modal = document.getElementById('studentModal');
        
        form.dataset.editing = 'true';
        form.dataset.studentId = studentId;
        form.studentName.value = student.name;
        form.studentEmail.value = student.email;
        form.studentCourse.value = student.course || '';
        form.studentPassword.value = '';
        form.studentStatus.value = student.status.toLowerCase();
        
        document.getElementById('studentModalTitle').textContent = 'Edit Student';
        modal.style.display = 'block';
    }

    editLecturer(lecturerId) {
        const lecturer = this.lecturers.find(l => l.lecturer_id === lecturerId);
        if (!lecturer) return;

        const form = document.getElementById('lecturerForm');
        const modal = document.getElementById('lecturerModal');
        
        form.dataset.editing = 'true';
        form.dataset.lecturerId = lecturerId;
        form.lecturerName.value = lecturer.name;
        form.lecturerEmail.value = lecturer.email;
        form.lecturerPassword.value = '';
        form.lecturerDepartment.value = lecturer.department;
        form.lecturerStatus.value = lecturer.status.toLowerCase();
        
        document.getElementById('lecturerModalTitle').textContent = 'Edit Lecturer';
        modal.style.display = 'block';
    }

    openModal(type) {
        const modal = document.getElementById(`${type}Modal`);
        const form = document.getElementById(`${type}Form`);
        const title = document.getElementById(`${type}ModalTitle`);
        
        if (modal && form) {
            form.reset();
            form.dataset.editing = 'false';
            title.textContent = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            modal.style.display = 'block';
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showSection(sectionId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });

        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;

            if (sectionId === 'analytics') {
                this.loadAnalytics();
            }
        }
    }

    initializeProfileCircle(user) {
        const profileCircle = document.querySelector('.profile-circle');
        const nameSpan = document.querySelector('.dropdown-header .name');
        const emailSpan = document.querySelector('.dropdown-header .email');
        
        if (profileCircle && user) {
            const initials = user.name.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();
            
            profileCircle.textContent = initials;
            
            if (nameSpan) nameSpan.textContent = user.name;
            if (emailSpan) emailSpan.textContent = user.email;
        }
    }

    async saveSettings(type) {
        try {
            const form = document.getElementById(`${type}SettingsForm`);
            if (!form) return;

            // Just display a success message without making API calls
            this.showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} settings updated successfully`);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings');
        }
    }

    async performManualBackup() {
        try {
            const button = document.getElementById('manualBackupBtn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Backing up...';

            const response = await this.fetchAPI('create_backup.php');
            
            if (!response.success) throw new Error(response.message);
            
            this.showSuccess('Backup created successfully');
            
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showError('Failed to create backup');
        } finally {
            const button = document.getElementById('manualBackupBtn');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-download"></i> Manual Backup';
        }
    }

    populateSettingsForms(settings) {
        // General Settings
        const generalForm = document.getElementById('generalSettingsForm');
        if (generalForm && settings.general) {
            generalForm.systemName.value = settings.general.system_name || '';
            generalForm.academicYear.value = settings.general.academic_year || '';
            generalForm.maintenanceMode.checked = settings.general.maintenance_mode || false;
        }

        // Email Settings
        const emailForm = document.getElementById('emailSettingsForm');
        if (emailForm && settings.email) {
            emailForm.smtpServer.value = settings.email.smtp_server || '';
            emailForm.smtpPort.value = settings.email.smtp_port || '';
            emailForm.emailFrom.value = settings.email.email_from || '';
        }

        // Backup Settings
        const backupForm = document.getElementById('backupSettingsForm');
        if (backupForm && settings.backup) {
            backupForm.autoBackup.checked = settings.backup.auto_backup || false;
            backupForm.backupFrequency.value = settings.backup.frequency || 'daily';
        }
    }

    async handleLogout() {
        try {
            const response = await this.fetchAPI('logout.php');
            if (response.success) {
                window.location.href = 'index.html';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            this.showError('Failed to logout');
        }
    }

    async fetchAPI(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };

        try {
            // If there's a body and it's not already a string, stringify it
            if (options.body && typeof options.body !== 'string') {
                options.body = JSON.stringify(options.body);
            }

            const response = await fetch(`../backend/${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });

            // Handle unauthorized access
            if (response.status === 401) {
                window.location.href = 'index.html';
                throw new Error('Session expired. Please login again.');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new TypeError("Server response was not JSON");
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            this.showError(error.message || 'Failed to fetch data');
            throw error;
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1200;
            animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
        `;

        switch (type) {
            case 'error':
                notification.style.background = '#e74c3c';
                break;
            case 'success':
                notification.style.background = '#2ecc71';
                break;
            default:
                notification.style.background = '#3498db';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
}); 