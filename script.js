class EduPlanApp {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.studySessions = [];
        this.quotes = [
            "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
            "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
            "Education is the passport to the future, for tomorrow belongs to those who prepare for it today. - Malcolm X",
            "The expert in anything was once a beginner. - Helen Hayes",
            "Don't let what you cannot do interfere with what you can do. - John Wooden"
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupTimer();
    }

    // Authentication Methods
    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }
    }

    login(username, password) {
        // Simulate authentication (in real app, this would call an API)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showMainApp();
            this.showNotification('Welcome back!', 'success');
            return true;
        } else {
            this.showNotification('Invalid credentials. Please try again.', 'error');
            return false;
        }
    }

    signup(username, email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.find(u => u.username === username)) {
            this.showNotification('Username already exists.', 'error');
            return false;
        }

        if (users.find(u => u.email === email)) {
            this.showNotification('Email already registered.', 'error');
            return false;
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            joinedAt: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true
            }
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.showMainApp();
        this.showNotification('Account created successfully!', 'success');
        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLoginScreen();
        this.showNotification('Logged out successfully.', 'info');
    }

    // UI Navigation Methods
    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        this.loadUserData();
        this.updateGreeting();
        this.setupDashboard();
    }

    // Task Management Methods
    loadUserData() {
        const userTasks = localStorage.getItem(`tasks_${this.currentUser.id}`);
        this.tasks = userTasks ? JSON.parse(userTasks) : [];
        
        const userSessions = localStorage.getItem(`sessions_${this.currentUser.id}`);
        this.studySessions = userSessions ? JSON.parse(userSessions) : [];
    }

    saveUserData() {
        localStorage.setItem(`tasks_${this.currentUser.id}`, JSON.stringify(this.tasks));
        localStorage.setItem(`sessions_${this.currentUser.id}`, JSON.stringify(this.studySessions));
    }

    addTask(title, subject, deadline, priority, description = '') {
        const task = {
            id: Date.now().toString(),
            title,
            subject,
            deadline,
            priority,
            description,
            status: 'todo',
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            userId: this.currentUser.id
        };
        
        this.tasks.push(task);
        this.saveUserData();
        this.renderTasks();
        this.updateStats();
        
        this.showNotification('Task added successfully!', 'success');
    }

    // Dashboard Methods
    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Morning';
        if (hour >= 12 && hour < 18) greeting = 'Afternoon';
        if (hour >= 18) greeting = 'Evening';

        document.getElementById('greetingTime').textContent = greeting;
        document.getElementById('greetingName').textContent = this.currentUser.username;
        document.getElementById('displayUsername').textContent = this.currentUser.username;

        // Set random quote
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        document.getElementById('dailyQuote').textContent = randomQuote;
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = this.tasks.filter(task => !task.completed).length;
        const todayTasks = this.tasks.filter(task => 
            !task.completed && this.isToday(new Date(task.deadline))
        ).length;

        // Update counts
        document.getElementById('pendingTasksCount').textContent = todayTasks;
        document.getElementById('todoCount').textContent = this.tasks.filter(t => t.status === 'todo').length;
        document.getElementById('progressCount').textContent = this.tasks.filter(t => t.status === 'progress').length;
        document.getElementById('reviewCount').textContent = this.tasks.filter(t => t.status === 'review').length;
        document.getElementById('completedCount').textContent = completedTasks;

        // Calculate productivity score
        const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        document.getElementById('productivityScore').textContent = `${productivity}%`;

        // Calculate study time (simplified)
        const totalStudyTime = this.studySessions.reduce((total, session) => total + session.duration, 0);
        document.getElementById('studyTime').textContent = `${(totalStudyTime / 60).toFixed(1)}h`;

        // Update goals achieved
        document.getElementById('goalsAchieved').textContent = `${completedTasks}/5`;
    }

    // Timer functionality
    setupTimer() {
        this.timer = {
            duration: 25 * 60, // 25 minutes in seconds
            remaining: 25 * 60,
            isRunning: false,
            interval: null
        };
    }

    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.isRunning = true;
            this.timer.interval = setInterval(() => {
                this.timer.remaining--;
                this.updateTimerDisplay();
                
                if (this.timer.remaining <= 0) {
                    this.completeTimer();
                }
            }, 1000);
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Login/Signup forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Form tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.dataset.tab);
            });
        });

        // Password visibility toggle
        document.querySelectorAll('.toggle-password').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const input = e.target.previousElementSibling;
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                e.target.classList.toggle('fa-eye');
                e.target.classList.toggle('fa-eye-slash');
            });
        });

        // Task form
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(e.target.dataset.section);
            });
        });

        // Quick actions
        document.getElementById('quickTaskBtn').addEventListener('click', () => {
            this.openQuickTaskModal();
        });

        document.getElementById('studyTimerBtn').addEventListener('click', () => {
            this.openTimerModal();
        });
    }

    handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        this.login(username, password);
    }

    handleSignup() {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match.', 'error');
            return;
        }

        this.signup(username, email, password);
    }

    handleTaskSubmit() {
        const title = document.getElementById('taskTitle').value;
        const subject = document.getElementById('taskSubject').value;
        const deadline = document.getElementById('taskDeadline').value;
        const priority = document.getElementById('taskPriority').value;
        const description = document.getElementById('taskDescription').value;

        if (title && subject && deadline) {
            this.addTask(title, subject, deadline, priority, description);
            document.getElementById('taskForm').reset();
        }
    }

    // Utility Methods
    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    switchSection(section) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
        
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        document.getElementById(`${section}Section`).classList.add('active');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    // Placeholder methods for future implementation
    setupDashboard() {
        this.renderTasks();
        this.updateStats();
    }

    renderTasks() {
        // Task rendering logic will be implemented here
        console.log('Rendering tasks...');
    }

    openQuickTaskModal() {
        // Quick task modal implementation
        console.log('Opening quick task modal...');
    }

    openTimerModal() {
        // Timer modal implementation
        console.log('Opening timer modal...');
    }

    updateTimerDisplay() {
        // Timer display update
        console.log('Updating timer display...');
    }

    completeTimer() {
        // Timer completion logic
        console.log('Timer completed!');
    }
}

// Additional CSS for notifications
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    z-index: 10000;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideInRight 0.3s ease;
}

.notification.success { background: #10b981; }
.notification.error { background: #ef4444; }
.notification.info { background: #3b82f6; }

.close-notification {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.2rem;
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.eduPlanApp = new EduPlanApp();
});