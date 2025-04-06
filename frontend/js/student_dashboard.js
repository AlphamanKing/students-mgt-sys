class StudentDashboard {
    constructor() {
        this.currentSection = 'analytics';
        this.charts = {};
        this.initializeEventListeners();
        this.loadStudentData();
    }

    initializeEventListeners() {
        // Navigation event listeners
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sectionId = e.currentTarget.getAttribute('data-section');
                if (sectionId) {
                    this.showSection(sectionId);
                }
            });
        });

        // Profile circle click event
        const profileCircle = document.querySelector('.profile-circle');
        const profileDropdown = document.querySelector('.profile-dropdown');
        
        if (profileCircle && profileDropdown) {
            profileCircle.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileCircle.contains(e.target)) {
                    profileDropdown.style.display = 'none';
                }
            });
        }

        // Logout event listener
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadStudentData() {
        try {
            const response = await fetch('../backend/get_student_data.php');
            if (!response.ok) throw new Error('Failed to fetch student data');
            
            const data = await response.json();
            if (data.success) {
                this.initializeProfileCircle(data.user);
                await this.loadAnalytics();
            } else {
                this.showError('Failed to load student data');
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            this.showError('An error occurred while loading student data');
        }
    }

    initializeProfileCircle(user) {
        const profileCircle = document.querySelector('.profile-circle');
        const nameSpan = document.querySelector('.dropdown-header .name');
        const emailSpan = document.querySelector('.dropdown-header .email');
        
        if (profileCircle && user) {
            // Get initials from name
            const initials = user.name.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();
            
            profileCircle.textContent = initials;
            
            if (nameSpan) nameSpan.textContent = user.name;
            if (emailSpan) emailSpan.textContent = user.email;
        }
    }

    async loadAnalytics() {
        try {
            // Load grades data
            const gradesResponse = await fetch('../backend/get_grades.php');
            const gradesData = await gradesResponse.json();

            // Load attendance data
            const attendanceResponse = await fetch('../backend/get_attendance.php');
            const attendanceData = await attendanceResponse.json();

            if (gradesData.success && attendanceData.success) {
                this.renderGradesChart(gradesData.grades);
                this.renderAttendanceChart(attendanceData.attendance);
                this.updateAttendanceSummary(attendanceData.attendance);
                this.renderGradesTable(gradesData.grades);
            } else {
                this.showError('Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('An error occurred while loading analytics');
        }
    }

    renderGradesChart(grades) {
        const ctx = document.getElementById('gradesChart');
        if (!ctx) return;

        if (this.charts.grades) {
            this.charts.grades.destroy();
        }

        const gradeLabels = grades.map(g => g.subject);
        const gradeValues = grades.map(g => g.score);

        this.charts.grades = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: gradeLabels,
                datasets: [{
                    label: 'Grades',
                    data: gradeValues,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
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

    renderAttendanceChart(attendance) {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        if (this.charts.attendance) {
            this.charts.attendance.destroy();
        }

        const totalClasses = attendance.present + attendance.absent;
        const attendancePercentage = (attendance.present / totalClasses) * 100;

        this.charts.attendance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent'],
                datasets: [{
                    data: [attendance.present, attendance.absent],
                    backgroundColor: ['#2ecc71', '#e74c3c']
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

    updateAttendanceSummary(attendance) {
        const summaryElement = document.querySelector('.attendance-summary');
        if (!summaryElement) return;

        const totalClasses = attendance.present + attendance.absent;
        const attendancePercentage = ((attendance.present / totalClasses) * 100).toFixed(1);
        const isEligible = attendancePercentage >= 75;

        summaryElement.innerHTML = `
            <div class="attendance-stat">
                <span class="label">Total Classes</span>
                <span class="value">${totalClasses}</span>
            </div>
            <div class="attendance-stat">
                <span class="label">Classes Attended</span>
                <span class="value">${attendance.present}</span>
            </div>
            <div class="attendance-stat">
                <span class="label">Classes Missed</span>
                <span class="value">${attendance.absent}</span>
            </div>
            <div class="attendance-stat">
                <span class="label">Attendance Percentage</span>
                <span class="value">${attendancePercentage}%</span>
            </div>
            <div class="attendance-stat">
                <span class="label">Eligibility Status</span>
                <span class="eligibility-badge ${isEligible ? 'eligible' : 'not-eligible'}">
                    ${isEligible ? 'Eligible' : 'Not Eligible'}
                </span>
            </div>
        `;
    }

    renderGradesTable(grades) {
        const tableBody = document.querySelector('#gradesTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = grades.map(grade => `
            <tr>
                <td>${grade.subject}</td>
                <td>${grade.score}</td>
                <td>
                    <span class="grade-badge grade-${this.getGradeClass(grade.score)}">
                        ${this.getGradeLetter(grade.score)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    getGradeLetter(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    getGradeClass(score) {
        return this.getGradeLetter(score).toLowerCase();
    }

    showSection(sectionId) {
        // Update navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;

            // Refresh charts if showing analytics section
            if (sectionId === 'analytics') {
                this.loadAnalytics();
            }
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px; background: #f8d7da; color: #721c24; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 1000;';
        errorDiv.textContent = message;

        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    async handleLogout() {
        try {
            const response = await fetch('../backend/logout.php');
            const data = await response.json();
            
            if (data.success) {
                // Clear session storage
                sessionStorage.clear();
                // Redirect to index.html
                window.location.href = 'index.html';
            } else {
                this.showError('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            this.showError('An error occurred during logout');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudentDashboard();
});