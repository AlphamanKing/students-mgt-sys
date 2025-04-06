class StudentDashboard {
    constructor() {
        this.currentSection = 'analytics';
        this.charts = {};
        
        // Bind methods that are used as callbacks
        this.printFullReport = this.printFullReport.bind(this);
        this.exportFullReportCSV = this.exportFullReportCSV.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.showSection = this.showSection.bind(this);
        
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

        // Export buttons event listeners
        const pdfButton = document.getElementById('exportPDF');
        const csvButton = document.getElementById('exportCSV');

        if (pdfButton) {
            pdfButton.addEventListener('click', this.printFullReport);
        }

        if (csvButton) {
            csvButton.addEventListener('click', this.exportFullReportCSV);
        }

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
            // First get the student's ID
            const studentDataResponse = await fetch('../backend/get_student_data.php');
            const studentData = await studentDataResponse.json();
            
            if (!studentData.success || !studentData.user || !studentData.user.student_id) {
                throw new Error('Failed to load student data');
            }
            
            const studentId = studentData.user.student_id;

            // Load grades data with student_id
            const gradesResponse = await fetch(`../backend/get_grades.php?student_id=${studentId}`);
            const gradesData = await gradesResponse.json();
            console.log('Grades response:', gradesData);

            // Load attendance data with student_id
            const attendanceResponse = await fetch(`../backend/get_attendance.php?student_id=${studentId}`);
            const attendanceData = await attendanceResponse.json();
            console.log('Attendance response:', attendanceData);

            if (gradesData.success && attendanceData.success) {
                const grades = gradesData.data || [];
                const attendance = attendanceData.data || [];

                this.renderGradesChart(grades);
                this.renderAttendanceChart(attendance);
                this.renderGradesTable(grades);
            } else {
                throw new Error('Failed to load analytics data');
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

        // Handle empty or invalid grades data
        if (!Array.isArray(grades) || grades.length === 0) {
            ctx.style.display = 'none';
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data-message';
            noDataMsg.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-info-circle"></i>
                    <p>No grades available</p>
                </div>
            `;
            ctx.parentNode.appendChild(noDataMsg);
            return;
        }

        // Remove any existing "No Data" message
        const existingMsg = ctx.parentNode.querySelector('.no-data-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        ctx.style.display = 'block';

        // Group grades by subject
        const gradesBySubject = {};
        grades.forEach(grade => {
            if (!grade || !grade.subject || !grade.grade) return;
            gradesBySubject[grade.subject] = grade.grade;
        });

        const subjects = Object.keys(gradesBySubject);
        const gradeValues = subjects.map(subject => {
            const grade = gradesBySubject[subject];
            // Convert letter grades to numeric values
            switch(grade.toUpperCase()) {
                case 'A': return 95;
                case 'B': return 85;
                case 'C': return 75;
                case 'D': return 65;
                case 'F': return 55;
                default: return 0;
            }
        });

        this.charts.grades = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Grade',
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
                        max: 100,
                        title: {
                            display: true,
                            text: 'Grade Value'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Subject'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Grade Distribution by Subject',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                let letterGrade = 'F';
                                if (value >= 90) letterGrade = 'A';
                                else if (value >= 80) letterGrade = 'B';
                                else if (value >= 70) letterGrade = 'C';
                                else if (value >= 60) letterGrade = 'D';
                                return `Grade: ${letterGrade} (${value})`;
                            }
                        }
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

        // Safely count present and absent records
        const presentCount = Array.isArray(attendance) ? 
            attendance.filter(record => record && record.status && record.status.toLowerCase() === 'present').length : 0;
        const absentCount = Array.isArray(attendance) ? 
            attendance.filter(record => record && record.status && record.status.toLowerCase() === 'absent').length : 0;
        const totalClasses = presentCount + absentCount;

        // If no attendance data, show "No Data" message
        if (totalClasses === 0) {
            ctx.style.display = 'none';
            const noDataMsg = document.createElement('div');
            noDataMsg.className = 'no-data-message';
            noDataMsg.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-info-circle"></i>
                    <p>No attendance records available</p>
                </div>
            `;
            ctx.parentNode.appendChild(noDataMsg);
            
            // Update attendance summary with zeros
            this.updateAttendanceSummary({ present: 0, absent: 0 });
            return;
        }

        // Remove any existing "No Data" message
        const existingMsg = ctx.parentNode.querySelector('.no-data-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        ctx.style.display = 'block';

        this.charts.attendance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent'],
                datasets: [{
                    data: [presentCount, absentCount],
                    backgroundColor: ['#2ecc71', '#e74c3c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Attendance Overview',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = totalClasses > 0 ? Math.round((value / totalClasses) * 100) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Update attendance summary
        this.updateAttendanceSummary({ present: presentCount, absent: absentCount });
    }

    updateAttendanceSummary(attendance) {
        const summaryElement = document.querySelector('.attendance-summary');
        if (!summaryElement) return;

        const totalClasses = attendance.present + attendance.absent;
        const attendancePercentage = totalClasses > 0 ? 
            ((attendance.present / totalClasses) * 100).toFixed(1) : '0.0';
        const isEligible = parseFloat(attendancePercentage) >= 75;

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

        if (!Array.isArray(grades) || grades.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 20px; color: #666;">
                        <i class="fas fa-info-circle"></i>
                        <p>No grades available</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = grades
            .filter(grade => grade && grade.subject && grade.grade)
            .map(grade => `
            <tr>
                <td>${grade.subject}</td>
                <td>
                        <span class="grade-badge grade-${grade.grade.toLowerCase()}">
                            ${grade.grade}
                    </span>
                </td>
            </tr>
            `)
            .join('');
    }

    getGradeLetter(score) {
        score = parseFloat(score);
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    getGradeClass(grade) {
        if (typeof grade === 'string') {
            return grade.toLowerCase();
        }
        return this.getGradeLetter(grade).toLowerCase();
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

    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`../backend/${endpoint}`, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
                ...options
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to fetch data');
        }
    }

    async printFullReport() {
        const button = document.getElementById('exportPDF');
        const printSection = document.getElementById('printFullReport');
        
        if (!button || !printSection) {
            console.error('Required elements not found');
            this.showError('Failed to prepare report');
            return;
        }
        
        const originalContent = button.innerHTML;
        const originalTitle = document.title;
        
        try {
            // Show loading state
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            button.disabled = true;

            // Get student data
            const studentData = await this.fetchAPI('get_student_data.php');
            if (!studentData.success) throw new Error('Failed to load student data');

            // Get grades data
            const gradesData = await this.fetchAPI(`get_grades.php?student_id=${studentData.user.student_id}`);
            if (!gradesData.success) throw new Error('Failed to load grades data');

            // Get attendance data
            const attendanceData = await this.fetchAPI(`get_attendance.php?student_id=${studentData.user.student_id}`);
            if (!attendanceData.success) throw new Error('Failed to load attendance data');

            const grades = gradesData.data || [];
            const attendance = attendanceData.data || [];

            // Update print section content
            printSection.innerHTML = `
                <div class="print-header">
                    <h1>Student Academic Report</h1>
                    <p class="generation-date"></p>
                </div>
                
                <div class="student-info">
                    <p><strong>Student Name:</strong> ${studentData.user.name}</p>
                    <p><strong>Student ID:</strong> ${studentData.user.student_id}</p>
                    <p><strong>Email:</strong> ${studentData.user.email || 'N/A'}</p>
                </div>
                
                <div class="report-section">
                    <h2>Academic Performance</h2>
                    <div class="gpa-info">
                        <p class="gpa"><strong>Current GPA:</strong> ${this.calculateGPA(grades)}</p>
                    </div>
                    <table class="grades-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${grades.map(grade => `
                                <tr>
                                    <td>${grade.subject}</td>
                                    <td><span class="grade-badge grade-${grade.grade.toLowerCase()}">${grade.grade}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="report-section">
                    <h2>Attendance Record</h2>
                    <div class="attendance-summary-print">
                        ${(() => {
                            const stats = this.calculateAttendanceStats(attendance);
                            return `
                                <p><strong>Total Classes:</strong> ${stats.total}</p>
                                <p><strong>Present:</strong> ${stats.present} (${stats.rate}%)</p>
                                <p><strong>Absent:</strong> ${stats.absent}</p>
                                <p><strong>Eligibility Status:</strong> <span class="eligibility-badge ${stats.isEligible ? 'eligible' : 'not-eligible'}">${stats.isEligible ? 'Eligible' : 'Not Eligible'}</span></p>
                            `;
                        })()}
                    </div>
                    <table class="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${[...attendance]
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map(record => `
                                    <tr>
                                        <td>${new Date(record.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</td>
                                        <td>${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="print-footer">
                    <p>Generated on <span class="generation-date"></span></p>
                    <p>This is an official academic report. Please handle with care.</p>
                </div>
            `;

            // Update generation date
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            printSection.querySelectorAll('.generation-date').forEach(el => {
                el.textContent = currentDate;
            });

            // Set print-specific title
            document.title = `Academic Report - ${studentData.user.name}`;
            
            // Make print section visible
            printSection.style.display = 'block';
            
            // Print after a short delay to ensure content is rendered
            setTimeout(() => {
                window.print();
                
                // Reset after printing
                printSection.style.display = 'none';
                document.title = originalTitle;
            }, 100);

        } catch (error) {
            console.error('Print error:', error);
            this.showError('Failed to prepare report');
            printSection.style.display = 'none';
            document.title = originalTitle;
        } finally {
            // Reset button state
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }

    async exportFullReportCSV() {
        const button = document.getElementById('exportCSV');
        if (!button) {
            console.error('CSV export button not found');
            this.showError('Failed to export CSV report');
            return;
        }
        
        const originalContent = button.innerHTML;
        
        try {
            // Show loading state
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating CSV...';
            button.disabled = true;

            // Get student data
            const studentData = await this.fetchAPI('get_student_data.php');
            if (!studentData.success) throw new Error('Failed to load student data');

            // Get grades data
            const gradesData = await this.fetchAPI(`get_grades.php?student_id=${studentData.user.student_id}`);
            if (!gradesData.success) throw new Error('Failed to load grades data');

            // Get attendance data
            const attendanceData = await this.fetchAPI(`get_attendance.php?student_id=${studentData.user.student_id}`);
            if (!attendanceData.success) throw new Error('Failed to load attendance data');

            const grades = gradesData.data || [];
            const attendance = attendanceData.data || [];
            
            // Create CSV content
            let csvContent = `Student Academic Report\n`;
            csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
            
            // Student information
            csvContent += `Student Information\n`;
            csvContent += `Name,${studentData.user.name}\n`;
            csvContent += `Student ID,${studentData.user.student_id}\n`;
            csvContent += `Email,${studentData.user.email || 'N/A'}\n\n`;
            
            // Academic performance
            csvContent += `Academic Performance\n`;
            csvContent += `Subject,Grade\n`;
            grades.forEach(grade => {
                csvContent += `${grade.subject},${grade.grade}\n`;
            });
            
            // Calculate GPA
            const gpa = this.calculateGPA(grades);
            csvContent += `GPA,${gpa}\n\n`;
            
            // Attendance record
            csvContent += `Attendance Record\n`;
            const stats = this.calculateAttendanceStats(attendance);
            csvContent += `Total Classes,${stats.total}\n`;
            csvContent += `Present,${stats.present}\n`;
            csvContent += `Absent,${stats.absent}\n`;
            csvContent += `Attendance Rate,${stats.rate}%\n`;
            csvContent += `Eligibility Status,${stats.isEligible ? 'Eligible' : 'Not Eligible'}\n\n`;
            
            csvContent += `Date,Status\n`;
            attendance.forEach(record => {
                csvContent += `${record.date},${record.status}\n`;
            });
            
            // Create and download the CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `student_report_${studentData.user.student_id}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export CSV report');
        } finally {
            // Reset button state
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }

    calculateGPA(grades) {
        const gradePoints = {
            'A': 4.0,
            'B': 3.0,
            'C': 2.0,
            'D': 1.0,
            'F': 0.0
        };

        const totalPoints = grades.reduce((sum, grade) => {
            return sum + (gradePoints[grade.grade.toUpperCase()] || 0);
        }, 0);

        return grades.length > 0 ? 
            (totalPoints / grades.length).toFixed(2) : '0.00';
    }

    calculateAttendanceStats(attendance) {
        const total = attendance.length;
        const present = attendance.filter(record => 
            record.status.toLowerCase() === 'present'
        ).length;
        const absent = total - present;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
        const isEligible = parseFloat(rate) >= 75;

        return { total, present, absent, rate, isEligible };
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudentDashboard();
});