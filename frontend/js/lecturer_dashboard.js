class LecturerDashboard {
    constructor() {
      this.API_BASE_URL = '/sis-master/backend';
      this.ACTIVE_SECTION_CLASS = 'active';
      this.ACTIVE_NAV_CLASS = 'active';
      this.gradeChart = null;
      this.attendanceChart = null;
      this.debug = true; // Set to false in production
      this.selectedStudentId = null;
  
      document.addEventListener("DOMContentLoaded", () => {
        this.init();
        
        // Set up student select change handlers
        const studentSelect = document.getElementById('studentSelect');
        if (studentSelect) {
            studentSelect.addEventListener('change', (e) => {
                this.selectedStudentId = e.target.value;
                this.fetchGrades();
            });
        }

        const attendanceStudentSelect = document.getElementById('attendanceStudentSelect');
        if (attendanceStudentSelect) {
            attendanceStudentSelect.addEventListener('change', () => {
                this.fetchAttendance();
            });
        }

        // Initialize all student dropdowns
        this.fetchStudents();
      });
    }
  
    init() {
      this.cacheDOM();
      this.bindEvents();
      this.initCharts();
      this.showSection('dashboard');
      this.loadInitialData();
    }
  
    cacheDOM() {
      this.$sections = document.querySelectorAll(".section");
      this.$navItems = document.querySelectorAll(".nav-item");
      this.$gradeForm = document.getElementById("gradeForm");
      this.$attendanceForm = document.getElementById("attendanceForm");
      this.$logoutBtn = document.querySelector(".logout-btn");
    }
  
    bindEvents() {
      // Navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
          const section = item.getAttribute('data-section');
          this.showSection(section);
        });
      });

      // Toggle sidebar
      const toggleBtn = document.getElementById('toggleSidebar');
      const sidebar = document.getElementById('sidebar');
      
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
          sidebar.classList.toggle('collapsed');
          // Store the sidebar state in localStorage
          localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        // Restore sidebar state on page load
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
          sidebar.classList.add('collapsed');
        }
      }

      // Logout
      document.querySelector('.logout-btn').addEventListener('click', () => this.handleLogout());

      // Course & Class Selection
      document.getElementById('courseClassForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.loadData();
      });

      // Grade Form
      this.$gradeForm.addEventListener('submit', (e) => this.handleGradeSubmit(e));
      
      // Attendance Form
      this.$attendanceForm.addEventListener('submit', (e) => this.handleAttendanceSubmit(e));
      
      // Student Select for Attendance
      document.getElementById('attendanceStudentSelect').addEventListener('change', () => {
        this.fetchAttendance();
      });

      // Export Report Form
      document.getElementById('exportReportForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.generateReport(e);
      });
    }
  
    // SECTION MANAGEMENT
    showSection(sectionId) {
      // Hide all sections
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });
      
      // Show the selected section
      const selectedSection = document.getElementById(sectionId);
      if (selectedSection) {
        selectedSection.classList.add('active');
      }
      
      // Update active nav item
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
          item.classList.add('active');
        }
      });
      
      // Special handling for specific sections
      if (sectionId === 'manageGrades') {
        // Check if a student is selected
        if (!this.selectedStudentId) {
          const $tableBody = document.getElementById("gradesTable");
          if ($tableBody) {
            $tableBody.innerHTML = '<tr><td colspan="4">Please select a student to view grades</td></tr>';
          }
        } else {
        this.fetchGrades();
        }
      } else if (sectionId === 'manageAttendance') {
        this.fetchAttendance();
      } else if (sectionId === 'analytics') {
        this.fetchAnalyticsData();
      } else if (sectionId === 'exportReports') {
        // Populate the student dropdown in the export reports section
        this.populateExportStudentDropdown();
      }
    }
  
    // DATA LOADING
    loadInitialData() {
      this.fetchStudents();
    }
  
    initCharts() {
      const initChart = (id, type) => {
        const ctx = document.getElementById(id)?.getContext('2d');
        if (!ctx) {
          if (this.debug) console.warn(`Chart container #${id} not found`);
          return null;
        }
        return new Chart(ctx, {
          type: type,
          data: { labels: [], datasets: [] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      };
  
      this.gradeChart = initChart('gradeDistributionChart', 'pie');
      this.attendanceChart = initChart('attendanceTrendChart', 'line');
    }
  
    // API COMMUNICATION
   async fetchAPI(endpoint, options = {}) {
    try {
        const url = `${this.API_BASE_URL}/${endpoint}`;
        const response = await fetch(url, {
            credentials: 'include', // THIS IS CRUCIAL
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
  
        const data = await response.json();
        if (this.debug) console.log(`[API] Response from ${endpoint}:`, data);
  
        if (!data?.success) {
          throw new Error(data?.message || "Invalid response format");
        }
  
        return data;
  
      } catch (error) {
        console.error(`[API] Error in ${endpoint}:`, error);
        this.showToast(`Failed to load ${endpoint.replace('.php', '')}`, 'error');
        return { success: false, message: error.message };
      }
    }
  
    // STUDENT MANAGEMENT
    async fetchStudents() {
        try {
            console.log('[Students] Fetching student data...');
            const response = await fetch(`${this.API_BASE_URL}/get_students.php`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('[Students] Response status:', response.status);
            
            if (response.status === 401) {
                window.location.href = 'index.html';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            const result = await response.json();
            console.log('[Students] Parsed response:', result);
        
            if (!result.success || !result.students || !Array.isArray(result.students)) {
                throw new Error('Invalid response format or no students found');
            }
        
            // Sort students by name
            const students = result.students.sort((a, b) => 
                (a.name || '').localeCompare(b.name || '')
            );
            
            console.log(`[Students] Received ${students.length} students`);
        
            const selects = [
                document.getElementById("studentSelect"),
                document.getElementById("attendanceStudentSelect"),
                document.getElementById("exportStudentSelect")
            ].filter(Boolean);
        
            if (selects.length === 0) {
                console.warn('[Students] No dropdown elements found');
                return;
            }
        
            selects.forEach(select => {
                // Clear existing options
                select.innerHTML = '';
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '-- Select Student --';
                select.appendChild(defaultOption);
                
                // Add student options
                students.forEach(student => {
                    if (!student.student_id || !student.name) {
                        console.warn('[Students] Invalid student data:', student);
                        return;
                    }
                    
                    const option = document.createElement('option');
                    option.value = student.student_id;
                    option.textContent = student.name;
                    select.appendChild(option);
                });
            });
        
            console.log('[Students] Dropdowns populated successfully');

            // If there's only one student, select it automatically in all dropdowns
            if (students.length === 1) {
                selects.forEach(select => {
                    select.value = students[0].student_id;
                    // Trigger change event for dropdowns that need it
                    if (select.id === 'studentSelect') {
                        this.selectedStudentId = students[0].student_id;
                        this.fetchGrades();
                    } else if (select.id === 'attendanceStudentSelect') {
                        this.fetchAttendance();
                    }
                });
            }
        
        } catch (error) {
            console.error('[Students] Loading failed:', error);
            
            const selects = [
                document.getElementById("studentSelect"),
                document.getElementById("attendanceStudentSelect"),
                document.getElementById("exportStudentSelect")
            ].filter(Boolean);
            
            selects.forEach(select => {
                select.innerHTML = '<option value="">Error loading students. Please refresh the page.</option>';
            });
            
            this.showToast('Failed to load students. Please try refreshing the page.', 'error');
        }
    }
  
    // GRADE MANAGEMENT (FIXED)
    async fetchGrades() {
      try {
        // Check if a student is selected
        if (!this.selectedStudentId) {
          const $tableBody = document.getElementById("gradesTable");
          if ($tableBody) {
            $tableBody.innerHTML = '<tr><td colspan="4">Please select a student to view grades</td></tr>';
          }
          return;
        }
        
        // Fetch grades for the selected student
        const endpoint = `get_grades.php?student_id=${this.selectedStudentId}`;
        const response = await this.fetchAPI(endpoint);
        
        const grades = response.data || [];
        console.log('Grades data:', grades);
        
        const $tableBody = document.getElementById("gradesTable");
        if (!$tableBody) throw new Error("Grades table not found");
  
        $tableBody.innerHTML = grades && grades.length > 0
            ? grades.map(grade => this.renderGradeRow(grade)).join('')
            : '<tr><td colspan="4">No grades found for selected student</td></tr>';
  
      } catch (error) {
        console.error("[Grades] Error:", error);
        const $tableBody = document.getElementById("gradesTable");
        if ($tableBody) {
            $tableBody.innerHTML = '<tr><td colspan="4">Error loading grades</td></tr>';
        }
      }
    }
  
    renderGradeRow(grade) {
      console.log('Rendering grade row:', grade);
      
      // Ensure grade_id exists
      if (!grade.grade_id) {
        console.error('Grade ID is missing:', grade);
      }
      
      return `
        <tr>
          <td>${this.escapeHtml(grade.student_name || 'N/A')}</td>
          <td>${this.escapeHtml(grade.subject || 'N/A')}</td>
          <td>${this.escapeHtml(grade.grade || 'N/A')}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="event.preventDefault(); dashboard.editGrade(${grade.grade_id || 'undefined'}, ${grade.student_id}, '${this.escapeAttr(grade.subject)}', '${grade.grade}')">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.preventDefault(); dashboard.deleteGrade(${grade.grade_id || 'undefined'})">
              Delete
            </button>
          </td>
        </tr>
      `;
    }
  
    // ATTENDANCE MANAGEMENT (FIXED)
    async fetchAttendance() {
        try {
          // Get the selected student ID
          const selectedStudentId = document.getElementById("attendanceStudentSelect").value;
          
          // If no student is selected, show a message
          if (!selectedStudentId) {
            const $tableBody = document.getElementById("attendanceTable");
            if ($tableBody) {
              $tableBody.innerHTML = '<tr><td colspan="4">Please select a student to view attendance records</td></tr>';
            }
            return;
          }
          
          // Fetch attendance records for the selected student
          const response = await this.fetchAPI(`get_attendance.php?student_id=${selectedStudentId}`);
          
          // Debug log to verify response structure
          console.log('[Attendance] API Response:', response);
      
          // Handle both response formats:
          // 1. {success: true, attendance: [...]}
          // 2. {success: true, data: [...]}
          const attendanceData = response.attendance || response.data;
          
          if (!attendanceData || !Array.isArray(attendanceData)) {
            throw new Error('Invalid attendance data format');
          }
      
          const $tableBody = document.getElementById("attendanceTable");
          if (!$tableBody) throw new Error("Attendance table not found");
      
          $tableBody.innerHTML = attendanceData.length > 0
            ? attendanceData.map(record => this.renderAttendanceRow(record)).join('')
            : '<tr><td colspan="4">No attendance records found for this student</td></tr>';
      
          console.log(`[Attendance] Successfully loaded ${attendanceData.length} records`);
      
        } catch (error) {
          console.error("[Attendance] Error:", error);
          this.showToast("Failed to load attendance records", "error");
          
          // Show error in table
          const $tableBody = document.getElementById("attendanceTable");
          if ($tableBody) {
            $tableBody.innerHTML = '<tr><td colspan="4">Error loading attendance</td></tr>';
          }
        }
    }
  
    renderAttendanceRow(record) {
      console.log('Rendering attendance row:', record);
      
      // Ensure attendance_id exists
      if (!record.attendance_id) {
        console.error('Attendance ID is missing:', record);
      }
      
      return `
        <tr>
          <td>${this.escapeHtml(record.student_name || 'N/A')}</td>
          <td>${new Date(record.date).toLocaleDateString() || 'N/A'}</td>
          <td>${this.escapeHtml(record.status || 'N/A')}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="event.preventDefault(); dashboard.editAttendance(${record.attendance_id || 'undefined'}, ${record.student_id}, '${this.escapeAttr(record.date)}', '${this.escapeAttr(record.status)}')">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.preventDefault(); dashboard.deleteAttendance(${record.attendance_id || 'undefined'})">
              Delete
            </button>
          </td>
        </tr>
      `;
    }
  
    // ANALYTICS (FIXED)
    async fetchAnalyticsData() {
      try {
        const [gradesRes, attendanceRes] = await Promise.all([
          this.fetchAPI('get_grades.php'),
          this.fetchAPI('get_attendance.php')
        ]);
  
        // Process grades data
        if (gradesRes.success) {
          const gradesData = gradesRes.grades || gradesRes.data;
          if (gradesData) {
            this.renderGradeChart(gradesData);
            this.renderStudentPerformanceTable(gradesData, attendanceRes.attendance || attendanceRes.data);
          } else {
            console.warn("[Analytics] No grade data available");
          }
        }
  
        // Process attendance data
        if (attendanceRes.success) {
          const attendanceData = attendanceRes.attendance || attendanceRes.data;
          if (attendanceData) {
            this.renderAttendanceChart(attendanceData);
          } else {
            console.warn("[Analytics] No attendance data available");
          }
        }
  
      } catch (error) {
        console.error("[Analytics] Error:", error);
      }
    }
  
    renderGradeChart(grades) {
        if (!this.gradeChart || !grades?.length) {
          console.warn("[Grade Chart] No data or chart not initialized");
          return;
        }
      
        const gradeCounts = grades.reduce((acc, { grade }) => {
          // Safely handle undefined/null grades
          const letter = (grade?.charAt(0) || 'U').toUpperCase();
          acc[letter] = (acc[letter] || 0) + 1;
          return acc;
        }, {});
      
        const labels = Object.keys(gradeCounts).sort();
        const data = labels.map(label => gradeCounts[label]);
        
        // Calculate total for percentage
        const total = data.reduce((sum, count) => sum + count, 0);
        
        // Create a more descriptive label with count and percentage
        const formattedLabels = labels.map(label => {
          const count = gradeCounts[label];
          const percentage = Math.round((count / total) * 100);
          return `${label} (${count} - ${percentage}%)`;
        });
      
        this.gradeChart.data = {
          labels: formattedLabels,
          datasets: [{
            data: data,
            backgroundColor: [
              '#4CAF50', // Green for A
              '#8BC34A', // Light Green for B
              '#FFC107', // Amber for C
              '#FF9800', // Orange for D
              '#F44336', // Red for F
              '#9E9E9E'  // Grey for Unknown
            ].slice(0, labels.length),
            borderWidth: 1,
            borderColor: '#fff'
          }]
        };
        
        // Add title to the chart
        this.gradeChart.options.plugins.title = {
          display: true,
          text: 'Grade Distribution',
          font: {
            size: 16,
            weight: 'bold'
          }
        };
        
        this.gradeChart.update();
      }
  
    renderAttendanceChart(attendanceData) {
        if (!this.attendanceChart || !attendanceData?.length) {
            console.warn("[Analytics] Cannot render attendance chart: missing data or chart instance");
            return;
        }

        // Filter out invalid records and group by week
        const weeklyData = {};
        const studentNames = new Set();

        // First pass: collect valid student names
        attendanceData.forEach(record => {
            if (record?.student_name) {
                studentNames.add(record.student_name);
            }
        });

        if (studentNames.size === 0) {
            console.warn("[Analytics] No valid student data found for attendance chart");
            return;
        }

        // Second pass: process attendance data
        attendanceData.forEach(record => {
            if (!record?.date || !record?.student_name) return;
            
            const date = new Date(record.date);
            if (isNaN(date.getTime())) return; // Skip invalid dates
            
            const weekNumber = this.getWeekNumber(date);
            const weekKey = `${date.getFullYear()}-W${weekNumber}`;
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = {};
                studentNames.forEach(name => {
                    weeklyData[weekKey][name] = { present: 0, total: 0 };
                });
            }
            
            weeklyData[weekKey][record.student_name].total++;
            if (record.status?.toLowerCase() === 'present') {
                weeklyData[weekKey][record.student_name].present++;
            }
        });

        // Prepare chart data
        const weeks = Object.keys(weeklyData).sort();
        if (weeks.length === 0) {
            console.warn("[Analytics] No weekly data available for attendance chart");
            return;
        }

        const datasets = Array.from(studentNames).map(studentName => {
            const data = weeks.map(week => {
                const weekData = weeklyData[week][studentName];
                return weekData.total > 0 ? (weekData.present / weekData.total) * 100 : 0;
            });

            return {
                label: studentName,
                data: data,
                borderColor: this.getRandomColor(),
                fill: false,
                tension: 0.4
            };
        });

        // Update chart configuration
        this.attendanceChart.data = {
            labels: weeks.map(week => `Week ${week.split('-W')[1]}`),
            datasets: datasets
        };

        this.attendanceChart.options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Attendance Trends by Week',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${Math.round(context.raw)}% attendance`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Attendance Rate (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                }
            }
        };

        this.attendanceChart.update();
    }
  
    renderStudentPerformanceTable(grades, attendance) {
      if (!grades || !attendance) {
        console.warn("[Performance Table] Missing data");
        return;
      }
      
      // Group grades by student
      const studentGrades = {};
      grades.forEach(grade => {
        const studentId = grade.student_id;
        if (!studentGrades[studentId]) {
          studentGrades[studentId] = {
            name: grade.student_name,
            grades: [],
            totalAttendance: 0,
            presentAttendance: 0
          };
        }
        studentGrades[studentId].grades.push(grade.grade);
      });
      
      // Calculate attendance for each student
      attendance.forEach(record => {
        const studentId = record.student_id;
        if (studentGrades[studentId]) {
          studentGrades[studentId].totalAttendance++;
          if (record.status === 'Present') {
            studentGrades[studentId].presentAttendance++;
          }
        }
      });
      
      // Calculate performance metrics
      const performanceData = Object.values(studentGrades).map(student => {
        // Calculate average grade (convert letter grades to numbers)
        const gradeValues = student.grades.map(grade => {
          const letter = grade.charAt(0).toUpperCase();
          switch (letter) {
            case 'A': return 4.0;
            case 'B': return 3.0;
            case 'C': return 2.0;
            case 'D': return 1.0;
            case 'E': return 0.5;
            case 'F': return 0;
            default: return 0;
          }
        });
        
        const avgGrade = gradeValues.length > 0 
          ? (gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate attendance rate
        const attendanceRate = student.totalAttendance > 0
          ? Math.round((student.presentAttendance / student.totalAttendance) * 100)
          : 0;
        
        // Determine performance status
        let status = 'Average';
        if (avgGrade >= 3.5 && attendanceRate >= 90) {
          status = 'Excellent';
        } else if (avgGrade >= 3.0 && attendanceRate >= 80) {
          status = 'Good';
        } else if (avgGrade < 2.0 || attendanceRate < 70) {
          status = 'Needs Improvement';
        }
        
        return {
          name: student.name,
          avgGrade,
          attendanceRate,
          status
        };
      });
      
      // Render the table
      const tableBody = document.getElementById('studentPerformanceTable');
      if (!tableBody) {
        console.warn("[Performance Table] Table element not found");
        return;
      }
      
      if (performanceData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No performance data available</td></tr>';
        return;
      }
      
      tableBody.innerHTML = performanceData.map(student => `
        <tr>
          <td>${this.escapeHtml(student.name)}</td>
          <td>${student.avgGrade}</td>
          <td>${student.attendanceRate}%</td>
          <td>
            <span class="badge ${this.getStatusBadgeClass(student.status)}">
              ${student.status}
            </span>
          </td>
        </tr>
      `).join('');
    }
    
    getStatusBadgeClass(status) {
      switch (status) {
        case 'Excellent': return 'bg-success';
        case 'Good': return 'bg-info';
        case 'Average': return 'bg-warning';
        case 'Needs Improvement': return 'bg-danger';
        default: return 'bg-secondary';
      }
    }
  
    getWeekNumber(date) {
      const firstDay = new Date(date.getFullYear(), 0, 1);
      const dayDiff = (date - firstDay) / (24 * 60 * 60 * 1000);
      return Math.ceil((dayDiff + firstDay.getDay() + 1) / 7);
    }
  
    // Generate a random color for chart lines
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }
  
    // FORM HANDLERS
    async handleGradeSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.$gradeForm);
        
        // Get the grade ID from the hidden input
        const gradeId = formData.get('gradeId');
        
        // Prepare data object with all required fields
        const gradeData = {
            grade_id: gradeId && gradeId !== 'undefined' ? parseInt(gradeId) : null,
            student_id: parseInt(formData.get('student_id')),
            subject: formData.get('subject').trim(),
            grade: formData.get('grade')
        };
      
        // Validation
        if (!gradeData.student_id) {
            this.showToast('Please select a student', 'error');
            return;
        }
        if (!gradeData.subject) {
            this.showToast('Please enter a subject', 'error');
            return;
        }
        if (!gradeData.grade) {
            this.showToast('Please select a grade', 'error');
            return;
        }
      
        try {
            const endpoint = gradeData.grade_id ? 'update_grade.php' : 'add_grade.php';
            console.log('[Grade Submit] Sending data:', gradeData);
            
            const response = await fetch(`${this.API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gradeData),
                credentials: 'include'
            });
            
            const text = await response.text();
            console.log('[Grade Submit] Raw response:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('[Grade Submit] JSON parse error:', e);
                throw new Error('Invalid server response format');
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status} - ${response.statusText}`);
            }

            if (!data.success) {
                throw new Error(data.message || 'Operation failed');
            }

            // Show success message
            this.showToast(data.message || 'Grade saved successfully', 'success');
            
            // Store the current student ID before resetting the form
            const currentStudentId = this.selectedStudentId;
            
            // Reset form but keep the student selection
            this.$gradeForm.reset();
            document.getElementById('gradeId').value = '';
            
            // Set the student dropdown back to the previously selected student
            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect && currentStudentId) {
                studentSelect.value = currentStudentId;
                this.selectedStudentId = currentStudentId;
            }
            
            // Refresh grades for the selected student
            await this.fetchGrades();
            
        } catch (error) {
            console.error('[Grade Submit] Error:', error);
            this.showToast(error.message || 'Failed to save grade', 'error');
        }
    }
  
    async handleAttendanceSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.$attendanceForm);
        
        // Prepare data object
        const attendanceData = {
          attendance_id: formData.get('attendanceId') || null,
          student_id: parseInt(formData.get('student_id')),
          date: formData.get('date'),
          status: formData.get('status')
        };
      
        // Validation
        if (!attendanceData.student_id || !attendanceData.date || !attendanceData.status) {
          this.showToast('Please fill all required fields', 'error');
          return;
        }
      
        try {
          // Use add_attendance.php for both adding and updating
          const response = await this.fetchAPI('add_attendance.php', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
          });
      
          if (response.success) {
            // Store the current student ID before resetting the form
            const currentStudentId = document.getElementById('attendanceStudentSelect').value;
            
            // Reset the form
            this.$attendanceForm.reset();
            document.getElementById('attendanceId').value = '';
            
            // Set the student dropdown back to the previously selected student
            if (currentStudentId) {
              document.getElementById('attendanceStudentSelect').value = currentStudentId;
            }
            
            // Refresh attendance data
            await this.fetchAttendance();
            
            this.showToast(response.message || 'Attendance saved successfully!');
          } else {
            throw new Error(response.message || 'Failed to save attendance');
          }
      
        } catch (error) {
          console.error('[Attendance Submit] Error:', error);
          this.showToast(error.message, 'error');
        }
    }
  
    // CRUD OPERATIONS
    editGrade(gradeId, studentId, subject, grade) {
      console.log('Editing grade:', { gradeId, studentId, subject, grade });
      
      if (!gradeId || gradeId === 'undefined') {
        console.error('Invalid grade ID:', gradeId);
        this.showToast('Invalid grade ID', 'error');
        return;
      }

      // Get form elements
      const gradeIdInput = document.getElementById("gradeId");
      const studentSelect = document.getElementById("studentSelect");
      const subjectInput = document.getElementById("subject");
      const gradeInput = document.getElementById("gradeInput");

      // Validate form elements exist
      if (!gradeIdInput || !studentSelect || !subjectInput || !gradeInput) {
        console.error('Required form elements not found');
        this.showToast('Form elements not found', 'error');
        return;
      }

      // Set form values
      gradeIdInput.value = gradeId;
      studentSelect.value = studentId;
      subjectInput.value = this.decodeHtml(subject);
      gradeInput.value = grade;
      
      // Scroll to form
      this.$gradeForm.scrollIntoView({ behavior: 'smooth' });
    }
  
    async deleteGrade(gradeId) {
        console.log('Deleting grade:', gradeId);
        
        if (!gradeId || gradeId === 'undefined') {
          console.error('Invalid grade ID:', gradeId);
          this.showToast('Invalid grade ID', 'error');
          return;
        }
        
        if (!confirm('Are you sure you want to permanently delete this grade?')) return;
        
        try {
          // Store the current student ID before deletion
          const currentStudentId = this.selectedStudentId;
          
          const { success, message } = await this.fetchAPI('delete_grade.php', {
            method: 'POST',
            body: JSON.stringify({ grade_id: parseInt(gradeId) })
          });
      
          if (success) {
            // Ensure the student selection is maintained
            if (currentStudentId) {
              this.selectedStudentId = currentStudentId;
              const studentSelect = document.getElementById('studentSelect');
              if (studentSelect) {
                studentSelect.value = currentStudentId;
              }
            }
            
            // Refresh grades for the selected student
            await this.fetchGrades();
            this.showToast(message || 'Grade deleted successfully');
          } else {
            throw new Error(message || 'Failed to delete grade');
          }
          
        } catch (error) {
          console.error('[Delete Grade] Error:', error);
          this.showToast(error.message, 'error');
        }
    }
  
    // Add helper method to decode HTML entities
    decodeHtml(html) {
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    }
  
    editAttendance(attId, studentId, date, status) {
      console.log('Editing attendance:', { attId, studentId, date, status });
      
      if (!attId || attId === 'undefined') {
        console.error('Invalid attendance ID:', attId);
        this.showToast('Invalid attendance ID', 'error');
        return;
      }
      
      // Get form elements
      const attendanceIdInput = document.getElementById("attendanceId");
      const studentSelect = document.getElementById("attendanceStudentSelect");
      const dateInput = document.getElementById("attendanceDate");
      const statusInput = document.getElementById("attendanceStatus");
      
      // Validate form elements exist
      if (!attendanceIdInput || !studentSelect || !dateInput || !statusInput) {
        console.error('Required form elements not found');
        this.showToast('Form elements not found', 'error');
        return;
      }
      
      // Set form values
      attendanceIdInput.value = attId;
      studentSelect.value = studentId;
      dateInput.value = date.split('T')[0];
      statusInput.value = status;
      
      // Scroll to form
      this.$attendanceForm.scrollIntoView({ behavior: 'smooth' });
    }
  
    async deleteAttendance(attId) {
        console.log('Deleting attendance:', attId);
        
        if (!attId || attId === 'undefined') {
          console.error('Invalid attendance ID:', attId);
          this.showToast('Invalid attendance ID', 'error');
          return;
        }
        
        if (!confirm('Are you sure you want to delete this attendance record?')) return;
        
        try {
            // Store the current student ID before deletion
            const currentStudentId = document.getElementById('attendanceStudentSelect').value;
            
            const response = await this.fetchAPI('delete_attendance.php', {
                method: 'POST',
                body: JSON.stringify({ attendance_id: parseInt(attId) })
            });

            if (response.success) {
                // Set the student dropdown back to the previously selected student
                if (currentStudentId) {
                    document.getElementById('attendanceStudentSelect').value = currentStudentId;
                }
                
                await this.fetchAttendance();
                this.showToast(response.message || 'Attendance record deleted successfully');
            } else {
                throw new Error(response.message || 'Failed to delete attendance');
            }
            
        } catch (error) {
            console.error('[Delete Attendance] Error:', error);
            this.showToast(error.message, 'error');
        }
    }
  
    // UTILITIES
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    escapeAttr(unsafe) {
        return this.escapeHtml(unsafe).replace(/"/g, "&quot;");
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    async handleLogout(e) {
        e?.preventDefault(); // Prevent default if event exists

        // Confirm logout action
        if (!confirm('Are you sure you want to log out?')) {
            return;
        }

        try {
            // Show loading state
            this.$logoutBtn.disabled = true;
            this.$logoutBtn.textContent = 'Logging out...';
            
            // Call logout API
            const { success, message } = await this.fetchAPI('logout.php', {
                method: 'POST',
                credentials: 'include' // Ensure cookies are sent if using session cookies
            });

            if (success) {
                // Clear any client-side data
                localStorage.removeItem('lecturerAuthToken');
                sessionStorage.clear();
                
                // Redirect to login page
                window.location.href = "../frontend/index.html";
            } else {
                throw new Error(message || 'Logout failed');
            }
        } catch (error) {
            console.error("[Logout] Error:", error);
            this.showToast(error.message || 'Logout failed. Please try again.', 'error');
            
            // Reset button state
            if (this.$logoutBtn) {
                this.$logoutBtn.disabled = false;
                this.$logoutBtn.textContent = 'Logout';
            }
        }
    }

    // REPORT GENERATION AND EXPORT
    async generateReport(event) {
        event.preventDefault();
        
        // Get form data
        const studentId = document.getElementById('exportStudentSelect').value;
        const includeGrades = document.getElementById('includeGrades').checked;
        const includeAttendance = document.getElementById('includeAttendance').checked;
        const includePerformance = document.getElementById('includePerformance').checked;
        const includeRecommendations = document.getElementById('includeRecommendations').checked;
        const formatInput = document.querySelector('input[name="format"]:checked');
        
        if (!studentId) {
          this.showToast('Please select a student', 'error');
          return;
        }

        if (!formatInput) {
          this.showToast('Please select a report format', 'error');
          return;
        }

        const format = formatInput.value;
        
        try {
          // Fetch student data
          const studentResponse = await this.fetchAPI('get_students.php');
          
          if (!studentResponse.success || !studentResponse.students) {
            throw new Error('Failed to fetch student data');
          }
          
          const student = studentResponse.students.find(s => s.student_id === parseInt(studentId));
          if (!student) {
            throw new Error('Student not found');
          }

          let grades = [];
          let attendance = [];
          
          // Fetch grades if selected
          if (includeGrades) {
            const gradesResponse = await this.fetchAPI('get_grades.php');
            if (gradesResponse.success) {
              // Extract grades from data property and filter for selected student
              const allGrades = gradesResponse.data || gradesResponse.grades || [];
              grades = allGrades.filter(g => g.student_id === parseInt(studentId));
            }
          }
          
          // Fetch attendance if selected
          if (includeAttendance) {
            const attendanceResponse = await this.fetchAPI(`get_attendance.php?student_id=${studentId}`);
            if (attendanceResponse.success) {
              // Use the data directly since we're fetching for a specific student
              attendance = attendanceResponse.data || [];
            }
          }
          
          // Generate report content
          const reportContent = this.generateReportContent(student, grades, attendance, {
            includeGrades,
            includeAttendance,
            includePerformance,
            includeRecommendations
          });
          
          // Display preview
          const previewContainer = document.getElementById('reportPreview');
          if (previewContainer) {
            previewContainer.style.display = 'block';
            const reportContentDiv = document.getElementById('reportContent');
            if (reportContentDiv) {
              reportContentDiv.innerHTML = reportContent;
            }
          }
          
          // Export based on format
          if (format === 'pdf') {
            this.exportToPDF(reportContent, student.name);
          } else {
            this.exportToCSV(student, grades, attendance, {
              includeGrades,
              includeAttendance,
              includePerformance,
              includeRecommendations
            });
          }
          
          this.showToast('Report generated successfully', 'success');
        } catch (error) {
          console.error('[Generate Report] Error:', error);
          this.showToast('Failed to generate report', 'error');
        }
    }

    generateReportContent(student, grades, attendance, options) {
        let content = `
            <div class="report-content">
                <h2>Student Performance Report</h2>
                <div class="student-info">
                    <h3>Student Information</h3>
                    <p><strong>Name:</strong> ${student.name}</p>
                    <p><strong>Student ID:</strong> ${student.student_id}</p>
                    <p><strong>Email:</strong> ${student.email}</p>
                    <p><strong>Phone:</strong> ${student.phone || 'N/A'}</p>
                </div>
        `;
        
        // Add grades section if selected
        if (options.includeGrades && grades.length > 0) {
            content += `
                <div class="grades-section">
                    <h3>Academic Performance</h3>
                    <table class="table">
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
                                    <td>${grade.grade}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Add attendance section if selected
        if (options.includeAttendance && attendance.length > 0) {
            content += `
                <div class="attendance-section">
                    <h3>Attendance Record</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendance.map(record => `
                                <tr>
                                    <td>${record.date}</td>
                                    <td>${record.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Add performance analysis if selected
        if (options.includePerformance) {
            const performance = this.analyzePerformance(grades, attendance);
            content += `
                <div class="performance-section">
                    <h3>Performance Analysis</h3>
                    <p><strong>Average Grade:</strong> ${performance.averageGrade}</p>
                    <p><strong>Attendance Rate:</strong> ${performance.attendanceRate}%</p>
                    <p><strong>Overall Status:</strong> ${performance.status}</p>
                </div>
            `;
        }
        
        // Add recommendations if selected
        if (options.includeRecommendations) {
            const recommendations = this.generateRecommendations(grades, attendance);
            content += `
                <div class="recommendations-section">
                    <h3>Recommendations</h3>
                    <ul>
                        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        content += '</div>';
        return content;
    }

    analyzePerformance(grades, attendance) {
        // Calculate average grade
        let avgGrade = 'N/A';
        if (grades.length > 0) {
            const gradeValues = grades.map(grade => {
                const letter = grade.grade.charAt(0).toUpperCase();
                switch (letter) {
                    case 'A': return 4.0;
                    case 'B': return 3.0;
                    case 'C': return 2.0;
                    case 'D': return 1.0;
                    case 'E': return 0.5;
                    case 'F': return 0;
                    default: return 0;
                }
            });
            
            const sum = gradeValues.reduce((acc, val) => acc + val, 0);
            avgGrade = (sum / gradeValues.length).toFixed(2);
        }

        // Calculate attendance rate
        let attendanceRate = 0;
        if (attendance.length > 0) {
            const presentClasses = attendance.filter(a => a.status === 'Present').length;
            attendanceRate = Math.round((presentClasses / attendance.length) * 100);
        }

        // Determine overall performance status
        let status = 'Average';
        let statusClass = 'bg-warning';
        
        if (avgGrade >= 3.5 && attendanceRate >= 90) {
            status = 'Excellent';
            statusClass = 'bg-success';
        } else if (avgGrade >= 3.0 && attendanceRate >= 80) {
            status = 'Good';
            statusClass = 'bg-info';
        } else if (avgGrade < 2.0 || attendanceRate < 70) {
            status = 'Needs Improvement';
            statusClass = 'bg-danger';
        }

        return {
            averageGrade: avgGrade,
            attendanceRate: attendanceRate,
            status: status
        };
    }

    generateRecommendations(grades, attendance) {
        // Calculate metrics for recommendations
        let avgGrade = 'N/A';
        if (grades.length > 0) {
            const gradeValues = grades.map(grade => {
                const letter = grade.grade.charAt(0).toUpperCase();
                switch (letter) {
                    case 'A': return 4.0;
                    case 'B': return 3.0;
                    case 'C': return 2.0;
                    case 'D': return 1.0;
                    case 'E': return 0.5;
                    case 'F': return 0;
                    default: return 0;
                }
            });
            
            const sum = gradeValues.reduce((acc, val) => acc + val, 0);
            avgGrade = (sum / gradeValues.length).toFixed(2);
        }

        let attendanceRate = 0;
        if (attendance.length > 0) {
            const presentClasses = attendance.filter(a => a.status === 'Present').length;
            attendanceRate = Math.round((presentClasses / attendance.length) * 100);
        }

        // Generate recommendations based on performance
        let recommendations = [];
        
        // Academic recommendations
        if (avgGrade !== 'N/A') {
            if (avgGrade < 2.0) {
                recommendations.push('Consider additional tutoring or academic support to improve grades.');
                recommendations.push('Schedule regular meetings with the lecturer to discuss academic challenges.');
            } else if (avgGrade < 3.0) {
                recommendations.push('Focus on improving study habits and time management skills.');
                recommendations.push('Consider forming study groups with peers to enhance learning.');
            } else if (avgGrade >= 3.5) {
                recommendations.push('Maintain current academic performance and consider advanced coursework.');
                recommendations.push('Explore opportunities for academic leadership or mentoring roles.');
            }
        }
        
        // Attendance recommendations
        if (attendanceRate < 80) {
            recommendations.push('Improve attendance to ensure consistent learning and better academic outcomes.');
            recommendations.push('Communicate with the lecturer if there are legitimate reasons for absences.');
        } else if (attendanceRate >= 90) {
            recommendations.push('Excellent attendance record. Continue maintaining this level of commitment.');
        }
        
        // General recommendations
        recommendations.push('Regularly review course materials and complete assignments on time.');
        recommendations.push('Participate actively in class discussions and group activities.');
        
        return recommendations;
    }

    exportToPDF(content, studentName) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>Student Report - ${studentName}</title>
              <style>
                @media print {
                  @page {
                    margin-top: 0;
                    margin-bottom: 0;
                  }
                  body { 
                    padding-top: 20px;
                    padding-bottom: 20px;
                  }
                  /* Hide URL */
                  @page :first {
                    margin-top: 0;
                  }
                }
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                }
                .report-content { 
                  max-width: 800px; 
                  margin: 0 auto; 
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 10px 0; 
                }
                th, td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                  text-align: left; 
                }
                th { 
                  background-color: #f5f5f5; 
                }
                h2, h3 { 
                  color: #333; 
                }
                .student-info, .grades-section, .attendance-section, 
                .performance-section, .recommendations-section {
                  margin: 20px 0;
                  padding: 15px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
        
        // Wait for content to load then print
        printWindow.document.close();
        printWindow.onload = function() {
          printWindow.print();
          printWindow.close();
        };
    }

    exportToCSV(student, grades, attendance, options) {
        let csvContent = `Student Report - ${student.name}\n\n`;
        
        // Add student information
        csvContent += `Student Information\n`;
        csvContent += `Name,${student.name}\n`;
        csvContent += `Student ID,${student.student_id}\n`;
        csvContent += `Email,${student.email}\n`;
        csvContent += `Phone,${student.phone || 'N/A'}\n\n`;
        
        // Add grades if selected
        if (options.includeGrades && grades.length > 0) {
          csvContent += `Academic Performance\n`;
          csvContent += `Subject,Grade\n`;
          grades.forEach(grade => {
            csvContent += `${grade.subject},${grade.grade}\n`;
          });
          csvContent += '\n';
        }
        
        // Add attendance if selected
        if (options.includeAttendance && attendance.length > 0) {
          csvContent += `Attendance Record\n`;
          csvContent += `Date,Status\n`;
          attendance.forEach(record => {
            csvContent += `${record.date},${record.status}\n`;
          });
          csvContent += '\n';
        }
        
        // Add performance analysis if selected
        if (options.includePerformance) {
          const performance = this.analyzePerformance(grades, attendance);
          csvContent += `Performance Analysis\n`;
          csvContent += `Average Grade,${performance.averageGrade}\n`;
          csvContent += `Attendance Rate,${performance.attendanceRate}%\n`;
          csvContent += `Overall Status,${performance.status}\n\n`;
        }
        
        // Add recommendations if selected
        if (options.includeRecommendations) {
          const recommendations = this.generateRecommendations(grades, attendance);
          csvContent += `Recommendations\n`;
          recommendations.forEach((rec, index) => {
            csvContent += `${index + 1},${rec}\n`;
          });
        }
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        // Format student name for filename (remove special characters and spaces)
        const safeStudentName = student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `student_report_${safeStudentName}.csv`;
        link.click();
    }

    populateExportStudentDropdown() {
        const exportStudentSelect = document.getElementById('exportStudentSelect');
        if (!exportStudentSelect) {
            console.error('[Export] Export student select element not found');
            return;
        }

        // Clear existing options and add default option
        exportStudentSelect.innerHTML = '<option value="">-- Select Student --</option>';

        // Fetch students data
        fetch(`${this.API_BASE_URL}/get_students.php`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(response => {
            if (!response.success || !response.students || !Array.isArray(response.students)) {
                throw new Error('Invalid response format or no students found');
            }

            // Sort students by name
            const students = response.students.sort((a, b) => 
                (a.name || '').localeCompare(b.name || '')
            );

            // Add student options to the dropdown
            students.forEach(student => {
                if (!student.student_id || !student.name) {
                    console.warn('[Export] Invalid student data:', student);
                    return;
                }

                const option = document.createElement('option');
                option.value = student.student_id;
                option.textContent = student.name;
                exportStudentSelect.appendChild(option);
            });

            console.log(`[Export] Populated dropdown with ${students.length} students`);

            // If there's only one student, select it automatically
            if (students.length === 1) {
                exportStudentSelect.value = students[0].student_id;
            }
        })
        .catch(error => {
            console.error('[Export] Failed to load students:', error);
            exportStudentSelect.innerHTML = '<option value="">Error loading students. Please refresh.</option>';
            this.showToast('Failed to load students. Please try refreshing the page.', 'error');
        });
    }
}

// Initialize the dashboard
const dashboard = new LecturerDashboard();