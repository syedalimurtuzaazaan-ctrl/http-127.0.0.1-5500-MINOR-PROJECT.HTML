// script.js - PERFECT Employee Management System + WRAPPER SUPPORT
class EmployeeManager {
    constructor() {
        this.employees = JSON.parse(localStorage.getItem('employees')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';

        // debounce timer for multi search
        this.searchTimer = null;
    }

    init() {
        // 🔒 STEP 1: CSS Protection FIRST - WRAPPER COMPATIBLE
        if (this.currentUser) {
            document.body.classList.add('logged-in');
        } else {
            document.body.classList.remove('logged-in');
        }

        this.bindEvents();

        // STEP 2: Show correct screen
        if (this.currentUser) {
            this.showApp();
            this.updateUserInfo();
            this.updateEmployeeCount();
            this.renderTable();
            this.updateLiveCount();
        } else {
            this.showAuth();
        }

        // STEP 3: Theme
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    bindEvents() {
        // AUTH EVENTS
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('showRegister')?.addEventListener('click', () => this.showRegister());
        document.getElementById('showLogin')?.addEventListener('click', () => this.showLogin());

        // APP EVENTS (safe binding with null checks)
        const employeeForm = document.getElementById('employeeForm');
        const themeToggle = document.getElementById('themeToggle');
        const logoutBtn = document.getElementById('logoutBtn');
        const clearBtn = document.getElementById('clearBtn');
        const scrollToFormBtn = document.getElementById('scrollToFormBtn');

        // NEW: multi-search inputs
        const searchById = document.getElementById('searchById');
        const searchByName = document.getElementById('searchByName');
        const searchByContact = document.getElementById('searchByContact');
        const searchByEmail = document.getElementById('searchByEmail');

        if (employeeForm) employeeForm.addEventListener('submit', (e) => this.handleSubmit(e));
        if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearForm());
        if (scrollToFormBtn) scrollToFormBtn.addEventListener('click', () => this.scrollToForm());

        // remove old single searchInput usage – now use multi filters with debounce
        const multiSearchInputs = [searchById, searchByName, searchByContact, searchByEmail];
        multiSearchInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    clearTimeout(this.searchTimer);
                    this.searchTimer = setTimeout(() => this.applySearchFilters(), 200);
                });
            }
        });

        // ✅ GLOBAL ACCESS FOR HTML onclick (used by edit/delete buttons)
        window.employeeManager = this;
    }

    handleRegister(e) {
        e.preventDefault();
        const fullName = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;

        // Validation
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        if (this.users.find(user => user.email === email)) {
            this.showNotification('Email already registered!', 'error');
            return;
        }

        // Create user
        const user = { 
            id: Date.now().toString(), 
            fullName, email, password, 
            role, createdAt: new Date().toISOString() 
        };
        this.users.push(user);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        this.showNotification('Account created! Please login.', 'success');
        this.showLogin();
        document.getElementById('registerForm').reset();
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // ✅ ADMIN LOGIN (Demo credentials)
        if (email === 'admin@workplace.com' && password === 'work123') {
            this.currentUser = { email: 'admin@workplace.com', role: 'admin', fullName: 'Admin' };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.loginSuccess();
            return;
        }

        // Regular user login
        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.loginSuccess();
        } else {
            this.showNotification('Invalid credentials! Demo: admin@workplace.com / work123', 'error');
            document.getElementById('loginEmail').focus();
        }
    }

    loginSuccess() {
        document.body.classList.add('logged-in');
        this.showNotification('Login successful! Welcome back!', 'success');
        setTimeout(() => this.showApp(), 1200);
    }

    showRegister() {
        document.getElementById('login-section')?.classList.remove('active');
        document.getElementById('register-section')?.classList.add('active');
    }

    showLogin() {
        document.getElementById('register-section')?.classList.remove('active');
        document.getElementById('login-section')?.classList.add('active');
        document.getElementById('loginForm')?.reset();
    }

    handleSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('idNumber').value.trim();
        const name = document.getElementById('name').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const email = document.getElementById('emailEmployee').value.trim();
        const editId = document.getElementById('editId').value;

        if (!id || !name || !contact) {
            this.showNotification('Please fill required fields (*)', 'error');
            return;
        }

        const employee = { id, name, contact, email: email || '' };

        if (editId) {
            // EDIT
            const index = this.employees.findIndex(emp => emp.id === editId);
            if (index !== -1) {
                this.employees[index] = employee;
                this.showNotification('Employee updated successfully!', 'success');
            }
        } else {
            // ADD NEW
            if (this.employees.find(emp => emp.id === id)) {
                this.showNotification('Employee ID already exists!', 'error');
                return;
            }
            this.employees.push(employee);
            this.showNotification('Employee added successfully!', 'success');
        }

        localStorage.setItem('employees', JSON.stringify(this.employees));
        this.updateEmployeeCount();
        this.updateLiveCount();
        this.renderTable();
        this.clearForm();
    }

    editEmployee(id) {
        const employee = this.employees.find(emp => emp.id === id);
        if (employee) {
            document.getElementById('editId').value = employee.id;
            document.getElementById('idNumber').value = employee.id;
            document.getElementById('idNumber').disabled = true;
            document.getElementById('name').value = employee.name;
            document.getElementById('contact').value = employee.contact;
            document.getElementById('emailEmployee').value = employee.email || '';
            document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update Employee';
            document.querySelector('.crud-form')?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteEmployee(id) {
        if (confirm('Are you sure you want to delete this employee?')) {
            this.employees = this.employees.filter(emp => emp.id !== id);
            localStorage.setItem('employees', JSON.stringify(this.employees));
            this.updateEmployeeCount();
            this.updateLiveCount();
            this.renderTable();
            this.showNotification('Employee deleted successfully!', 'success');
        }
    }

    // OLD single-box search no longer used by UI, but kept in case you call it manually
    searchEmployees(query) {
        const filtered = this.employees.filter(emp =>
            emp.name.toLowerCase().includes(query.toLowerCase()) ||
            emp.id.toLowerCase().includes(query.toLowerCase()) ||
            emp.contact.includes(query) ||
            (emp.email && emp.email.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderTable(filtered);
    }

    // NEW: multi-field search (ID, Name, Contact, Email)
    applySearchFilters() {
        const idQuery = (document.getElementById('searchById')?.value || '').toLowerCase();
        const nameQuery = (document.getElementById('searchByName')?.value || '').toLowerCase();
        const contactQuery = (document.getElementById('searchByContact')?.value || '').toLowerCase();
        const emailQuery = (document.getElementById('searchByEmail')?.value || '').toLowerCase();

        const filtered = this.employees.filter(emp => {
            const idMatch = !idQuery || emp.id.toLowerCase().includes(idQuery);
            const nameMatch = !nameQuery || emp.name.toLowerCase().includes(nameQuery);
            const contactMatch = !contactQuery || emp.contact.toLowerCase().includes(contactQuery);
            const emailMatch = !emailQuery || (emp.email && emp.email.toLowerCase().includes(emailQuery));
            return idMatch && nameMatch && contactMatch && emailMatch;
        });

        this.renderTable(filtered);
    }

    renderTable(employees = this.employees) {
        const tbody = document.getElementById('employeeTableBody');
        const emptyState = document.getElementById('emptyState');
        const loadingState = document.getElementById('loadingState');

        if (!tbody) return;

        // Hide loading
        if (loadingState) loadingState.style.display = 'none';

        if (!employees.length) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = employees.map(emp => `
            <tr>
                <td><strong>${emp.id}</strong></td>
                <td>${emp.name}</td>
                <td>${emp.contact}</td>
                <td>${emp.email || '-'}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="employeeManager.editEmployee('${emp.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="employeeManager.deleteEmployee('${emp.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Add to your EmployeeManager class
    scrollToForm() {
        document.querySelector('.crud-form')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    updateLiveCount() {
        const liveCount = document.getElementById('liveEmployeeCount');
        if (liveCount) {
            liveCount.textContent = this.employees.length;
        }
    }

    updateEmployeeCount() {
        const countSpan = document.getElementById('employeeCount');
        if (countSpan) countSpan.textContent = this.employees.length;
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.currentUser) {
            userInfo.textContent = `${this.currentUser.email} (${this.currentUser.role})`;
        }
    }

    clearForm() {
        const form = document.getElementById('employeeForm');
        if (form) form.reset();
        document.getElementById('editId').value = '';
        document.getElementById('idNumber').disabled = false;
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-user-plus"></i> Add Employee';
    }

    showApp() {
        // Hide auth, show wrapper/app
        const authContainer = document.getElementById('auth-container');
        const crudApp = document.getElementById('crud-app');
        const wrapper = document.querySelector('.wrapper');
        
        if (authContainer) authContainer.style.display = 'none';
        if (crudApp) crudApp.style.display = 'block';
        if (wrapper) wrapper.style.display = 'flex';
        
        this.updateUserInfo();
        this.renderTable();
        this.updateEmployeeCount();
        this.updateLiveCount();
    }

    showAuth() {
        document.body.classList.remove('logged-in');
        const authContainer = document.getElementById('auth-container');
        const crudApp = document.getElementById('crud-app');
        const wrapper = document.querySelector('.wrapper');
        
        if (crudApp) crudApp.style.display = 'none';
        if (wrapper) wrapper.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
        
        this.showLogin();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.body.classList.remove('logged-in');
        this.showAuth();
        this.clearForm();
        this.showNotification('Logged out successfully!', 'success');
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : '');
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        setTimeout(() => notification.classList.remove('show'), 4000);
    }
}

// 🚀 PERFECT INITIALIZATION - WRAPPER READY
document.addEventListener('DOMContentLoaded', () => {
    window.employeeManager = new EmployeeManager();
    employeeManager.init();
});
