// Global state
let currentAdminToken = null;
let colleges = [];
let events = [];

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupNavigation();
    setupModal();
    await loadColleges();
    await loadEvents();
    await loadEventsForRegistration();
    setupEventListeners();
}

// Navigation setup
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.dataset.section;
            
            // Update active nav button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// Modal setup
function setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Event listeners setup
function setupEventListeners() {
    // Filter events
    document.getElementById('filterBtn').addEventListener('click', filterEvents);
    
    // Registration form
    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    
    // Admin login
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    
    // Create event form
    document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);
    
    // Admin tabs
    setupAdminTabs();
    
    // Report generation
    document.getElementById('generateReport').addEventListener('click', generateReport);
    
    // Feedback form
    setupFeedbackForm();
}

// Admin tabs setup
function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Load admin events if manage events tab is selected
            if (tabId === 'manage-events') {
                loadAdminEvents();
            }
            
            // Load attendance events if attendance tab is selected
            if (tabId === 'manage-attendance') {
                loadEventsForAttendance();
            }
        });
    });
}

// Load colleges
async function loadColleges() {
    try {
        const response = await fetch(`${API_BASE}/colleges`);
        const data = await response.json();
        
        if (data.success) {
            colleges = data.colleges;
            populateCollegeSelects();
        }
    } catch (error) {
        console.error('Error loading colleges:', error);
    }
}

// Populate college select elements
function populateCollegeSelects() {
    const selects = ['collegeFilter', 'reportCollege']; // Removed eventCollege since it's now a text input
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            // Clear existing options (except first)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add college options
            colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college.id;
                option.textContent = college.name;
                select.appendChild(option);
            });
        }
    });
}

// Load events
async function loadEvents(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE}/events?${params}`);
        const data = await response.json();
        
        if (data.success) {
            events = data.events;
            displayEvents(events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        displayError('Failed to load events');
    }
}

// Display events in grid
function displayEvents(eventsToShow) {
    const container = document.getElementById('eventsList');
    
    if (!eventsToShow || eventsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No events found.</p>';
        return;
    }
    
    container.innerHTML = eventsToShow.map(event => `
        <div class="event-card">
            <h3>${event.title}</h3>
            <span class="event-type">${event.type}</span>
            <div class="event-details">
                <p><strong>College:</strong> ${event.college_name}</p>
                <p><strong>Date:</strong> ${new Date(event.start_time).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${new Date(event.start_time).toLocaleTimeString()}</p>
                ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            </div>
            <div class="event-stats">
                <span>Registered: ${event.registrations_count}</span>
                ${event.capacity > 0 ? `<span>Available: ${event.available_spots}</span>` : ''}
            </div>
            <div class="event-actions">
                <button class="btn btn-primary" onclick="registerForEvent('${event.id}')" 
                        ${event.is_full ? 'disabled' : ''}>
                    ${event.is_full ? 'Full' : 'Register'}
                </button>
                <button class="btn btn-secondary" onclick="viewEventDetails('${event.id}')">
                    Details
                </button>
            </div>
        </div>
    `).join('');
}

// Filter events
async function filterEvents() {
    const filters = {
        college_id: document.getElementById('collegeFilter').value,
        type: document.getElementById('typeFilter').value,
        q: document.getElementById('searchFilter').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    await loadEvents(filters);
}

// Load events for registration dropdown
async function loadEventsForRegistration() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('eventSelect');
            select.innerHTML = '<option value="">Choose an event...</option>';
            
            data.events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = `${event.title} - ${event.college_name}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading events for registration:', error);
    }
}

// Handle registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const formData = {
        student_id: 'new',
        name: document.getElementById('studentName').value,
        email: document.getElementById('studentEmail').value,
        roll_no: document.getElementById('rollNo').value,
        phone: document.getElementById('phone').value
    };
    
    const eventId = document.getElementById('eventSelect').value;
    
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showModal('Success', `Successfully registered for the event!<br><br>Registration ID: ${data.registration.id}`);
            document.getElementById('registrationForm').reset();
            await loadEvents(); // Refresh events list
        } else {
            showModal('Error', data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showModal('Error', 'Registration failed. Please try again.');
    }
}

// Register for event (from event card)
function registerForEvent(eventId) {
    // Switch to registration tab and pre-select event
    document.querySelector('[data-section="register"]').click();
    document.getElementById('eventSelect').value = eventId;
}

// View event details
async function viewEventDetails(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);
        const data = await response.json();
        
        if (data.success) {
            const event = data.event;
            const content = `
                <h3>${event.title}</h3>
                <p><strong>Type:</strong> ${event.type}</p>
                <p><strong>College:</strong> ${event.college_name}</p>
                <p><strong>Description:</strong> ${event.description || 'No description available'}</p>
                <p><strong>Start:</strong> ${new Date(event.start_time).toLocaleString()}</p>
                <p><strong>End:</strong> ${new Date(event.end_time).toLocaleString()}</p>
                <p><strong>Capacity:</strong> ${event.capacity > 0 ? event.capacity : 'Unlimited'}</p>
                <p><strong>Registered:</strong> ${event.registrations_count}</p>
                <p><strong>Attended:</strong> ${event.attendance_count}</p>
                ${event.available_spots !== null ? `<p><strong>Available Spots:</strong> ${event.available_spots}</p>` : ''}
            `;
            showModal('Event Details', content);
        }
    } catch (error) {
        console.error('Error fetching event details:', error);
        showModal('Error', 'Failed to load event details');
    }
}

// Handle admin login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const token = document.getElementById('adminToken').value;
    
    // Test admin token by trying to fetch admin events
    try {
        const response = await fetch(`${API_BASE}/admin/events`, {
            headers: { 'x-admin-token': token }
        });
        
        if (response.ok) {
            currentAdminToken = token;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            showModal('Success', 'Admin login successful!');
        } else {
            showModal('Error', 'Invalid admin token');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showModal('Error', 'Login failed. Please try again.');
    }
}

// Handle create event
async function handleCreateEvent(e) {
    e.preventDefault();
    
    if (!currentAdminToken) {
        showModal('Error', 'Please login as admin first');
        return;
    }
    
    const formData = {
        college_name: document.getElementById('eventCollege').value.trim(),
        title: document.getElementById('eventTitle').value,
        type: document.getElementById('eventType').value,
        description: document.getElementById('eventDescription').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        capacity: parseInt(document.getElementById('capacity').value) || 100
    };
    
    console.log('Sending event data:', formData);
    
    try {
        const response = await fetch(`${API_BASE}/admin/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': currentAdminToken
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showModal('Success', 'Event created successfully!');
            document.getElementById('createEventForm').reset();
            await loadEvents(); // Refresh events list
            await loadEventsForRegistration(); // Refresh registration dropdown
        } else {
            let errorMessage = data.error || 'Failed to create event';
            if (data.details && data.details.length > 0) {
                errorMessage += ':\n' + data.details.join('\n');
            }
            showModal('Error', errorMessage.replace(/\n/g, '<br>'));
        }
    } catch (error) {
        console.error('Create event error:', error);
        showModal('Error', 'Failed to create event. Please try again.');
    }
}

// Load admin events
async function loadAdminEvents() {
    if (!currentAdminToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/events`, {
            headers: { 'x-admin-token': currentAdminToken }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAdminEvents(data.events);
        }
    } catch (error) {
        console.error('Error loading admin events:', error);
    }
}

// Display admin events
function displayAdminEvents(adminEvents) {
    const container = document.getElementById('adminEventsList');
    
    if (!adminEvents || adminEvents.length === 0) {
        container.innerHTML = '<p>No events found.</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>College</th>
                    <th>Date</th>
                    <th>Registrations</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${adminEvents.map(event => `
                    <tr>
                        <td>${event.title}</td>
                        <td>${event.type}</td>
                        <td>${event.college_name}</td>
                        <td>${new Date(event.start_time).toLocaleDateString()}</td>
                        <td>${event.registrations_count}</td>
                        <td>${event.status}</td>
                        <td>
                            <button class="btn btn-secondary" onclick="viewEventDetails('${event.id}')">
                                View
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Generate reports
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const collegeId = document.getElementById('reportCollege').value;
    
    try {
        let url = `${API_BASE}/reports/${reportType}`;
        const params = new URLSearchParams();
        
        if (collegeId) params.append('college_id', collegeId);
        if (reportType === 'top-active') params.append('limit', '10');
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            displayReportResults(reportType, data);
        } else {
            showModal('Error', data.error || 'Failed to generate report');
        }
    } catch (error) {
        console.error('Report generation error:', error);
        showModal('Error', 'Failed to generate report. Please try again.');
    }
}

// Display report results
function displayReportResults(reportType, data) {
    const container = document.getElementById('reportResults');
    
    switch (reportType) {
        case 'popularity':
            displayPopularityReport(container, data.events);
            break;
        case 'attendance':
            displayAttendanceReport(container, data.events);
            break;
        case 'feedback':
            displayFeedbackReport(container, data.events);
            break;
        case 'top-active':
            displayTopActiveReport(container, data.students);
            break;
        default:
            container.innerHTML = '<p>Report data loaded successfully!</p>';
    }
}

// Display popularity report
function displayPopularityReport(container, events) {
    if (!events || events.length === 0) {
        container.innerHTML = '<p>No data available for this report.</p>';
        return;
    }
    
    container.innerHTML = `
        <h3>Event Popularity Report</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Event Title</th>
                    <th>Type</th>
                    <th>College</th>
                    <th>Date</th>
                    <th>Registrations</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(event => `
                    <tr>
                        <td>${event.title}</td>
                        <td>${event.type}</td>
                        <td>${event.college_name}</td>
                        <td>${new Date(event.start_time).toLocaleDateString()}</td>
                        <td>${event.registrations_count}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Display attendance report
function displayAttendanceReport(container, events) {
    if (!events || events.length === 0) {
        container.innerHTML = '<p>No data available for this report.</p>';
        return;
    }
    
    container.innerHTML = `
        <h3>Attendance Report</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Event Title</th>
                    <th>College</th>
                    <th>Date</th>
                    <th>Registrations</th>
                    <th>Attended</th>
                    <th>Attendance %</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(event => `
                    <tr>
                        <td>${event.title}</td>
                        <td>${event.college_name}</td>
                        <td>${new Date(event.start_time).toLocaleDateString()}</td>
                        <td>${event.registrations}</td>
                        <td>${event.attended}</td>
                        <td>${event.attendance_percentage}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Display feedback report
function displayFeedbackReport(container, events) {
    if (!events || events.length === 0) {
        container.innerHTML = '<p>No data available for this report.</p>';
        return;
    }
    
    container.innerHTML = `
        <h3>Feedback Report</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Event Title</th>
                    <th>College</th>
                    <th>Date</th>
                    <th>Average Rating</th>
                    <th>Total Ratings</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(event => `
                    <tr>
                        <td>${event.title}</td>
                        <td>${event.college_name}</td>
                        <td>${new Date(event.start_time).toLocaleDateString()}</td>
                        <td>${event.avg_rating || 'No ratings'}</td>
                        <td>${event.rating_count}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Display top active students report
function displayTopActiveReport(container, students) {
    if (!students || students.length === 0) {
        container.innerHTML = '<p>No data available for this report.</p>';
        return;
    }
    
    container.innerHTML = `
        <h3>Top Active Students Report</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>College</th>
                    <th>Events Attended</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(student => `
                    <tr>
                        <td>${student.name}</td>
                        <td>${student.roll_no}</td>
                        <td>${student.college_name}</td>
                        <td>${student.events_attended}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Utility functions
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `<h3>${title}</h3><div>${content}</div>`;
    modal.style.display = 'block';
}

function displayError(message) {
    showModal('Error', message);
}

// Load events for attendance management
async function loadEventsForAttendance() {
    if (!currentAdminToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/events`, {
            headers: { 'x-admin-token': currentAdminToken }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('attendanceEventSelect');
            select.innerHTML = '<option value="">Choose an event...</option>';
            
            data.events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = `${event.title} - ${event.college_name} (${new Date(event.start_time).toLocaleDateString()})`;
                select.appendChild(option);
            });
            
            // Add event listener for event selection
            select.addEventListener('change', loadEventRegistrations);
        }
    } catch (error) {
        console.error('Error loading events for attendance:', error);
    }
}

// Load registrations for selected event
async function loadEventRegistrations() {
    const eventId = document.getElementById('attendanceEventSelect').value;
    const container = document.getElementById('attendanceList');
    
    if (!eventId) {
        container.innerHTML = '';
        return;
    }
    
    if (!currentAdminToken) {
        container.innerHTML = '<p>Please login as admin first.</p>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/events/${eventId}/registrations`, {
            headers: { 'x-admin-token': currentAdminToken }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAttendanceList(data.event, data.registrations);
        } else {
            container.innerHTML = `<p>Error: ${data.error}</p>`;
        }
    } catch (error) {
        console.error('Error loading event registrations:', error);
        container.innerHTML = '<p>Failed to load registrations.</p>';
    }
}

// Display attendance list
function displayAttendanceList(event, registrations) {
    const container = document.getElementById('attendanceList');
    
    if (!registrations || registrations.length === 0) {
        container.innerHTML = `
            <div class="attendance-header">
                <h4>${event.title}</h4>
                <p>College: ${event.college_name}</p>
                <p>Date: ${new Date(event.start_time).toLocaleString()}</p>
            </div>
            <p>No registrations found for this event.</p>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="attendance-header">
            <h4>${event.title}</h4>
            <p>College: ${event.college_name}</p>
            <p>Date: ${new Date(event.start_time).toLocaleString()}</p>
            <p>Total Registrations: ${registrations.length}</p>
        </div>
        
        <div class="attendance-summary">
            <span>Present: ${registrations.filter(r => r.attendance_status === 'present').length}</span>
            <span>Absent: ${registrations.filter(r => r.attendance_status === 'absent').length}</span>
            <span>Not Marked: ${registrations.filter(r => r.attendance_status === 'not_marked').length}</span>
        </div>
        
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${registrations.map(reg => `
                    <tr class="attendance-row ${reg.attendance_status}">
                        <td>${reg.name}</td>
                        <td>${reg.roll_no || 'N/A'}</td>
                        <td>${reg.email}</td>
                        <td>
                            <span class="status-badge ${reg.attendance_status}">
                                ${reg.attendance_status === 'present' ? '✓ Present' : 
                                  reg.attendance_status === 'absent' ? '✗ Absent' : '- Not Marked'}
                            </span>
                            ${reg.checked_in_at ? `<br><small>Marked: ${new Date(reg.checked_in_at).toLocaleString()}</small>` : ''}
                        </td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="markAttendance('${reg.registration_id}', true)" 
                                    ${reg.attendance_status === 'present' ? 'disabled' : ''}>
                                Present
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="markAttendance('${reg.registration_id}', false)" 
                                    ${reg.attendance_status === 'absent' ? 'disabled' : ''}>
                                Absent
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Mark student attendance
async function markAttendance(registrationId, present) {
    if (!currentAdminToken) {
        showModal('Error', 'Please login as admin first');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/registrations/${registrationId}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': currentAdminToken
            },
            body: JSON.stringify({ present })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload the attendance list to show updated status
            await loadEventRegistrations();
            
            // Show success message
            showModal('Success', data.message);
        } else {
            showModal('Error', data.error || 'Failed to mark attendance');
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        showModal('Error', 'Failed to mark attendance. Please try again.');
    }
}

// Feedback Form Functions
function setupFeedbackForm() {
    // Method selection radio buttons
    const methodRadios = document.querySelectorAll('input[name="feedbackMethod"]');
    methodRadios.forEach(radio => {
        radio.addEventListener('change', toggleFeedbackMethod);
    });
    
    // Star rating system
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', handleStarRating);
        star.addEventListener('mouseover', handleStarHover);
        star.addEventListener('mouseout', handleStarOut);
    });
    
    // Search registrations button
    document.getElementById('searchRegistrations').addEventListener('click', searchUserRegistrations);
    
    // Registration selection
    document.getElementById('selectRegistration').addEventListener('change', handleRegistrationSelection);
    document.getElementById('registrationId').addEventListener('input', handleRegistrationIdInput);
    
    // Form submission
    document.getElementById('feedbackForm').addEventListener('submit', handleFeedbackSubmission);
    
    // Character counter for comments
    document.getElementById('comment').addEventListener('input', updateCharacterCount);
}

// Toggle between registration ID and email search methods
function toggleFeedbackMethod() {
    const selectedMethod = document.querySelector('input[name="feedbackMethod"]:checked').value;
    const registrationIdMethod = document.getElementById('registrationIdMethod');
    const emailSearchMethod = document.getElementById('emailSearchMethod');
    const eventDisplay = document.getElementById('eventDetailsDisplay');
    
    if (selectedMethod === 'registration') {
        registrationIdMethod.style.display = 'block';
        emailSearchMethod.style.display = 'none';
    } else {
        registrationIdMethod.style.display = 'none';
        emailSearchMethod.style.display = 'block';
    }
    
    // Reset form state
    eventDisplay.style.display = 'none';
    document.getElementById('submitFeedback').disabled = true;
    resetStarRating();
}

// Handle star rating clicks
function handleStarRating(e) {
    const rating = parseInt(e.target.dataset.rating);
    document.getElementById('rating').value = rating;
    
    updateStarDisplay(rating);
    updateRatingText(rating);
    checkFormValidity();
}

// Handle star rating hover
function handleStarHover(e) {
    const rating = parseInt(e.target.dataset.rating);
    updateStarDisplay(rating, true);
}

// Handle star rating mouse out
function handleStarOut() {
    const currentRating = document.getElementById('rating').value;
    updateStarDisplay(currentRating ? parseInt(currentRating) : 0);
}

// Update star display
function updateStarDisplay(rating, isHover = false) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = isHover ? '#ffc107' : '#ff6b35';
        } else {
            star.style.color = '#ddd';
        }
    });
}

// Update rating text
function updateRatingText(rating) {
    const ratingText = document.getElementById('ratingText');
    const texts = {
        1: 'Poor',
        2: 'Fair', 
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };
    ratingText.textContent = `${rating}/5 - ${texts[rating]}`;
    ratingText.style.color = rating >= 4 ? '#28a745' : rating >= 3 ? '#ffc107' : '#dc3545';
}

// Reset star rating
function resetStarRating() {
    document.getElementById('rating').value = '';
    updateStarDisplay(0);
    document.getElementById('ratingText').textContent = 'Please select a rating';
    document.getElementById('ratingText').style.color = '#666';
}

// Search user registrations by email
async function searchUserRegistrations() {
    const email = document.getElementById('feedbackEmail').value.trim();
    if (!email) {
        showModal('Error', 'Please enter your email address');
        return;
    }
    
    try {
        // Note: We'll need to create an endpoint to search registrations by email
        const response = await fetch(`${API_BASE}/registrations/search?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.success && data.registrations.length > 0) {
            populateRegistrationsList(data.registrations);
            document.getElementById('registrationsList').style.display = 'block';
        } else {
            showModal('Info', 'No registrations found for this email address');
            document.getElementById('registrationsList').style.display = 'none';
        }
    } catch (error) {
        console.error('Error searching registrations:', error);
        showModal('Error', 'Failed to search registrations. Please try again.');
    }
}

// Populate registrations list
function populateRegistrationsList(registrations) {
    const select = document.getElementById('selectRegistration');
    select.innerHTML = '<option value="">Choose an event...</option>';
    
    registrations.forEach(reg => {
        const option = document.createElement('option');
        option.value = reg.id;
        option.textContent = `${reg.event_title} - ${new Date(reg.event_date).toLocaleDateString()}`;
        select.appendChild(option);
    });
}

// Handle registration selection
async function handleRegistrationSelection() {
    const registrationId = document.getElementById('selectRegistration').value;
    if (registrationId) {
        await loadEventDetails(registrationId);
    }
}

// Handle registration ID input
async function handleRegistrationIdInput() {
    const registrationId = document.getElementById('registrationId').value.trim();
    if (registrationId.length >= 10) { // Assuming UUIDs or long IDs
        await loadEventDetails(registrationId);
    } else {
        document.getElementById('eventDetailsDisplay').style.display = 'none';
        document.getElementById('submitFeedback').disabled = true;
    }
}

// Load event details for a registration
async function loadEventDetails(registrationId) {
    try {
        // Check if feedback already exists
        const feedbackResponse = await fetch(`${API_BASE}/registrations/${registrationId}/feedback-status`);
        const feedbackData = await feedbackResponse.json();
        
        if (feedbackData.success && feedbackData.has_feedback) {
            showModal('Info', 'You have already submitted feedback for this event!');
            return;
        }
        
        // Load registration details  
        const response = await fetch(`${API_BASE}/registrations/${registrationId}/details`);
        const data = await response.json();
        
        if (data.success) {
            displayEventDetails(data.registration, data.event);
            document.getElementById('eventDetailsDisplay').style.display = 'block';
            checkFormValidity();
        } else {
            showModal('Error', data.error || 'Registration not found');
            document.getElementById('eventDetailsDisplay').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        showModal('Error', 'Failed to load event details');
    }
}

// Display event details
function displayEventDetails(registration, event) {
    document.getElementById('displayEventTitle').textContent = event.title;
    document.getElementById('displayEventDetails').innerHTML = `
        <strong>College:</strong> ${event.college_name}<br>
        <strong>Date:</strong> ${new Date(event.start_time).toLocaleString()}<br>
        <strong>Type:</strong> ${event.type}<br>
        <strong>Your Registration:</strong> ${new Date(registration.registered_at).toLocaleDateString()}
    `;
}

// Check form validity
function checkFormValidity() {
    const rating = document.getElementById('rating').value;
    const eventDisplayVisible = document.getElementById('eventDetailsDisplay').style.display !== 'none';
    
    document.getElementById('submitFeedback').disabled = !(rating && eventDisplayVisible);
}

// Handle feedback submission
async function handleFeedbackSubmission(e) {
    e.preventDefault();
    
    const selectedMethod = document.querySelector('input[name="feedbackMethod"]:checked').value;
    let registrationId;
    
    if (selectedMethod === 'registration') {
        registrationId = document.getElementById('registrationId').value.trim();
    } else {
        registrationId = document.getElementById('selectRegistration').value;
    }
    
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value.trim();
    
    if (!registrationId || !rating) {
        showModal('Error', 'Please complete all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/registrations/${registrationId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: parseInt(rating),
                comment: comment || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showModal('Success', 'Thank you for your feedback! Your response has been recorded.');
            
            // Reset form
            document.getElementById('feedbackForm').reset();
            document.getElementById('eventDetailsDisplay').style.display = 'none';
            document.getElementById('registrationsList').style.display = 'none';
            resetStarRating();
            document.getElementById('submitFeedback').disabled = true;
            
            // Reset method selection
            document.querySelector('input[name="feedbackMethod"][value="registration"]').checked = true;
            toggleFeedbackMethod();
        } else {
            showModal('Error', data.error || 'Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showModal('Error', 'Failed to submit feedback. Please try again.');
    }
}

// Update character count for comments
function updateCharacterCount() {
    const comment = document.getElementById('comment');
    const maxLength = 500;
    const currentLength = comment.value.length;
    
    // Create or update character counter
    let counter = comment.parentNode.querySelector('.char-counter');
    if (!counter) {
        counter = document.createElement('small');
        counter.className = 'char-counter';
        comment.parentNode.appendChild(counter);
    }
    
    counter.textContent = `${currentLength}/${maxLength} characters`;
    counter.style.color = currentLength > maxLength ? '#dc3545' : '#666';
    
    // Limit input if necessary
    if (currentLength > maxLength) {
        comment.value = comment.value.substring(0, maxLength);
        counter.textContent = `${maxLength}/${maxLength} characters`;
    }
}
