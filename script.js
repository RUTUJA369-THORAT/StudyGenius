document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animation library
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Loading screen
    setTimeout(function() {
        document.querySelector('.loading-screen').style.opacity = '0';
        setTimeout(function() {
            document.querySelector('.loading-screen').style.display = 'none';
        }, 300);
    }, 3000);

    // Set today's date as default start date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = formattedDate;

    // Subject form handling
    const subjectForm = document.getElementById('subjectForm');
    const subjectsContainer = document.getElementById('subjectsContainer');
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    
    renderSubjects();
    
    subjectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const subjectName = document.getElementById('subjectName').value.trim();
        const importance = document.getElementById('importance').value;
        const difficulty = document.getElementById('difficulty').value;
        
        if (!subjectName) return;
        
        const newSubject = {
            id: Date.now(),
            name: subjectName,
            importance: parseInt(importance),
            difficulty: parseInt(difficulty)
        };
        
        subjects.push(newSubject);
        saveSubjects();
        renderSubjects();
        
        // Reset form
        subjectForm.reset();
        document.getElementById('subjectName').focus();
    });
    
    function renderSubjects() {
        subjectsContainer.innerHTML = '';
        
        if (subjects.length === 0) {
            subjectsContainer.innerHTML = '<li class="list-group-item text-center text-muted">No subjects added yet</li>';
            return;
        }
        
        subjects.forEach(subject => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            let priorityClass = '';
            let priorityText = '';
            
            if (subject.importance === 3) {
                priorityClass = 'priority-high';
                priorityText = 'High';
            } else if (subject.importance === 2) {
                priorityClass = 'priority-medium';
                priorityText = 'Medium';
            } else {
                priorityClass = 'priority-low';
                priorityText = 'Low';
            }
            
            li.innerHTML = `
                <div>
                    <span class="subject-priority ${priorityClass}"></span>
                    ${subject.name} 
                    <small class="text-muted">(${priorityText} priority)</small>
                </div>
                <button class="btn btn-sm btn-outline-danger delete-subject" data-id="${subject.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            subjectsContainer.appendChild(li);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-subject').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                subjects = subjects.filter(subject => subject.id !== id);
                saveSubjects();
                renderSubjects();
            });
        });
    }
    
    function saveSubjects() {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }

    // Day selection buttons
    document.querySelectorAll('.day-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Time form handling
    const timeForm = document.getElementById('timeForm');
    const timetableContainer = document.getElementById('timetableContainer');
    const timetable = document.getElementById('timetable');
    
    timeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const dailyHours = parseFloat(document.getElementById('dailyHours').value);
        const startDate = document.getElementById('startDate').value;
        const selectedDays = Array.from(document.querySelectorAll('.day-btn.active'))
                                .map(btn => btn.getAttribute('data-day'));
        
        if (selectedDays.length === 0) {
            alert('Please select at least one study day');
            return;
        }
        
        if (subjects.length === 0) {
            alert('Please add at least one subject');
            return;
        }
        
        generateTimetable(dailyHours, selectedDays, startDate);
        timetableContainer.style.display = 'block';
        
        // Scroll to timetable
        timetableContainer.scrollIntoView({ behavior: 'smooth' });
    });
    
    function generateTimetable(dailyHours, selectedDays, startDate) {
        // Calculate total weight
        const totalWeight = subjects.reduce((sum, subject) => sum + subject.importance, 0);
        
        // Allocate hours based on weight
        const subjectsWithHours = subjects.map(subject => {
            const hours = (subject.importance / totalWeight) * dailyHours;
            return {
                ...subject,
                hours: parseFloat(hours.toFixed(2))
            };
        });
        
        // Generate timetable HTML
        let html = `
            <div class="table-responsive">
                <table class="table timetable">
                    <thead>
                        <tr>
                            <th>Day</th>
                            ${subjectsWithHours.map(subject => `
                                <th>${subject.name} <small>(${subject.hours}h)</small></th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedDays.map(day => `
                            <tr>
                                <td>${day}</td>
                                ${subjectsWithHours.map(subject => `
                                    <td>
                                        <div class="form-check">
                                            <input class="form-check-input session-checkbox" type="checkbox" 
                                                id="session-${day}-${subject.id}">
                                            <label class="form-check-label" for="session-${day}-${subject.id}">
                                                ${subject.hours}h
                                            </label>
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <h5>Study Plan Summary</h5>
                <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Total Study Days
                        <span class="badge bg-primary rounded-pill">${selectedDays.length}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Daily Study Hours
                        <span class="badge bg-primary rounded-pill">${dailyHours}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Weekly Study Hours
                        <span class="badge bg-primary rounded-pill">${(dailyHours * selectedDays.length).toFixed(1)}</span>
                    </li>
                </ul>
            </div>
        `;
        
        timetable.innerHTML = html;
        
        // Load completed sessions from localStorage
        loadCompletedSessions();
    }
    
    function loadCompletedSessions() {
        const completedSessions = JSON.parse(localStorage.getItem('completedSessions')) || [];
        
        completedSessions.forEach(session => {
            const checkbox = document.querySelector(`#session-${session.day}-${session.subjectId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.session-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const idParts = this.id.split('-');
                const day = idParts[1];
                const subjectId = parseInt(idParts[2]);
                
                let completedSessions = JSON.parse(localStorage.getItem('completedSessions')) || [];
                
                if (this.checked) {
                    // Add to completed sessions if not already there
                    if (!completedSessions.some(s => s.day === day && s.subjectId === subjectId)) {
                        completedSessions.push({ day, subjectId });
                    }
                } else {
                    // Remove from completed sessions
                    completedSessions = completedSessions.filter(s => !(s.day === day && s.subjectId === subjectId));
                }
                
                localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
                updateProgressChart();
                updateStreak();
                generateAISuggestions();
            });
        });
    }

    // Save plan button
    document.getElementById('savePlanBtn').addEventListener('click', function() {
        // Subjects are already saved when added
        // Save time preferences
        const dailyHours = document.getElementById('dailyHours').value;
        const startDate = document.getElementById('startDate').value;
        const selectedDays = Array.from(document.querySelectorAll('.day-btn.active'))
                                .map(btn => btn.getAttribute('data-day'));
        
        const timePreferences = {
            dailyHours,
            startDate,
            selectedDays
        };
        
        localStorage.setItem('timePreferences', JSON.stringify(timePreferences));
        
        // Show success message
        alert('Study plan saved successfully!');
    });

    // Print plan button
    document.getElementById('printPlanBtn').addEventListener('click', function() {
        window.print();
    });

    // Template buttons
    document.querySelectorAll('.use-template').forEach(button => {
        button.addEventListener('click', function() {
            const template = this.getAttribute('data-template');
            loadTemplate(template);
        });
    });
    
    function loadTemplate(template) {
        // Clear existing subjects
        subjects = [];
        
        // Add template subjects
        if (template === 'engineering') {
            subjects = [
                { id: 1, name: 'Calculus', importance: 3, difficulty: 3 },
                { id: 2, name: 'Physics', importance: 3, difficulty: 3 },
                { id: 3, name: 'Programming', importance: 2, difficulty: 2 },
                { id: 4, name: 'Chemistry', importance: 2, difficulty: 2 },
                { id: 5, name: 'Communication', importance: 1, difficulty: 1 }
            ];
        } else if (template === 'cbse') {
            subjects = [
                { id: 1, name: 'Mathematics', importance: 3, difficulty: 3 },
                { id: 2, name: 'Physics', importance: 3, difficulty: 3 },
                { id: 3, name: 'Chemistry', importance: 3, difficulty: 3 },
                { id: 4, name: 'Biology', importance: 2, difficulty: 2 },
                { id: 5, name: 'English', importance: 1, difficulty: 1 }
            ];
        } else if (template === 'medical') {
            subjects = [
                { id: 1, name: 'Biology', importance: 3, difficulty: 3 },
                { id: 2, name: 'Chemistry', importance: 3, difficulty: 3 },
                { id: 3, name: 'Physics', importance: 3, difficulty: 3 },
                { id: 4, name: 'Logical Reasoning', importance: 2, difficulty: 2 }
            ];
        }
        
        saveSubjects();
        renderSubjects();
        
        // Scroll to planner section
        document.querySelector('#planner').scrollIntoView({ behavior: 'smooth' });
    }

    // Progress chart
    let progressChart;
    
    function initProgressChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        const completedSessions = JSON.parse(localStorage.getItem('completedSessions')) || [];
        const totalSessions = calculateTotalSessions();
        
        const completedCount = completedSessions.length;
        const remainingCount = totalSessions - completedCount;
        
        progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [completedCount, remainingCount > 0 ? remainingCount : 0],
                    backgroundColor: [
                        'rgba(28, 200, 138, 0.8)',
                        'rgba(231, 74, 59, 0.8)'
                    ],
                    borderColor: [
                        'rgba(28, 200, 138, 1)',
                        'rgba(231, 74, 59, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
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
    }
    
    function updateProgressChart() {
        if (!progressChart) return;
        
        const completedSessions = JSON.parse(localStorage.getItem('completedSessions')) || [];
        const totalSessions = calculateTotalSessions();
        
        const completedCount = completedSessions.length;
        const remainingCount = totalSessions - completedCount;
        
        progressChart.data.datasets[0].data = [completedCount, remainingCount > 0 ? remainingCount : 0];
        progressChart.update();
    }
    
    function calculateTotalSessions() {
        const timePreferences = JSON.parse(localStorage.getItem('timePreferences'));
        if (!timePreferences) return 0;
        
        const selectedDays = timePreferences.selectedDays || [];
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        
        return selectedDays.length * subjects.length;
    }

    // Streak counter
    function updateStreak() {
        const completedSessions = JSON.parse(localStorage.getItem('completedSessions')) || [];
        
        if (completedSessions.length === 0) {
            document.getElementById('streakDays').textContent = '0';
            return;
        }
        
        // Simple streak calculation (for demo purposes)
        // In a real app, you'd track actual consecutive days
        const streakDays = Math.floor(completedSessions.length / 2);
        document.getElementById('streakDays').textContent = streakDays;
    }

    // AI Suggestions
    function generateAISuggestions() {
        const suggestionsContainer = document.getElementById('aiSuggestions');
        suggestionsContainer.innerHTML = '';
        
        const suggestions = [
            "Study your high-priority subjects first when your mind is fresh.",
            "Take short breaks every 45-50 minutes to maintain focus (Pomodoro technique).",
            "Review difficult topics multiple times with spaced repetition.",
            "Combine active recall with passive learning for better retention.",
            "Create summary notes for each subject to review before exams.",
            "Practice past exam papers to familiarize yourself with question patterns.",
            "Teach concepts to others to reinforce your own understanding."
        ];
        
        // Shuffle and pick 3 suggestions
        const shuffled = suggestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        
        selected.forEach((suggestion, index) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <h5 class="mb-1">Suggestion ${index + 1}</h5>
                <p class="mb-0">${suggestion}</p>
            `;
            suggestionsContainer.appendChild(div);
        });
    }
    
    document.getElementById('refreshSuggestions').addEventListener('click', generateAISuggestions);

    // Load saved data on page load
    function loadSavedData() {
        // Load time preferences
        const timePreferences = JSON.parse(localStorage.getItem('timePreferences'));
        if (timePreferences) {
            document.getElementById('dailyHours').value = timePreferences.dailyHours;
            document.getElementById('startDate').value = timePreferences.startDate;
            
            // Set active days
            document.querySelectorAll('.day-btn').forEach(button => {
                const day = button.getAttribute('data-day');
                if (timePreferences.selectedDays.includes(day)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
        
        // Initialize progress chart
        initProgressChart();
        updateStreak();
        generateAISuggestions();
    }
    
    loadSavedData();

    // Service Worker Registration for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('ServiceWorker registration successful');
            }).catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});

// Manifest for PWA
const manifest = {
    "name": "StudyGenius",
    "short_name": "StudyGenius",
    "start_url": ".",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#4e73df",
    "description": "Smart study planner for academic success",
    "icons": [
        {
            "src": "icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
};

// Create manifest file
const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
const manifestURL = URL.createObjectURL(manifestBlob);
document.querySelector('link[rel="manifest"]').href = manifestURL;