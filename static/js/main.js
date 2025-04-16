/**
 * Shift Scheduler - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Shift Scheduler loaded!');
    
    // Initialize year dropdown
    initYearDropdown();
    
    // Load engineers on page load
    loadEngineers();
    
    // Event listeners
    setupEventListeners();
});

// Initialize year dropdown with current year ± 5 years
function initYearDropdown() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

// Set up event listeners for interactive elements
function setupEventListeners() {
    // Save engineer button
    const saveEngineerBtn = document.getElementById('btnSaveEngineer');
    if (saveEngineerBtn) {
        saveEngineerBtn.addEventListener('click', saveEngineer);
    }
    
    // Save schedule button
    const saveScheduleBtn = document.getElementById('btnSaveSchedule');
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', saveSchedule);
    }
    
    // Generate Excel button
    const generateBtn = document.getElementById('btnGenerate');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateExcel);
    }
    
    // Auto-Assign Engineers button
    const autoAssignBtn = document.getElementById('btnAutoAssign');
    if (autoAssignBtn) {
        autoAssignBtn.addEventListener('click', autoAssignEngineers);
    }
    
    // Month and year select
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (monthSelect && yearSelect) {
        monthSelect.addEventListener('change', generateCalendars);
        yearSelect.addEventListener('change', generateCalendars);
    }
}

// Load engineers from API
function loadEngineers() {
    fetch('/api/engineers')
        .then(response => response.json())
        .then(data => {
            window.engineers = data || [];
            updateEngineersList();
            generateCalendars();
        })
        .catch(error => {
            console.error('Error loading engineers:', error);
            showAlert('Failed to load engineers. Please refresh the page.', 'danger');
        });
}

// Update the engineers list in the UI
function updateEngineersList() {
    const engineersList = document.getElementById('engineersList');
    if (!engineersList) return;
    
    engineersList.innerHTML = '';
    
    if (!window.engineers || window.engineers.length === 0) {
        engineersList.innerHTML = '<div class="alert alert-info">No engineers added yet.</div>';
        return;
    }
    
    window.engineers.forEach(eng => {
        const card = document.createElement('div');
        card.classList.add('card', 'mb-2');
        
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body', 'p-2');
        
        const nameRow = document.createElement('div');
        nameRow.classList.add('d-flex', 'justify-content-between', 'align-items-center');
        
        const name = document.createElement('h6');
        name.classList.add('mb-1');
        name.textContent = eng.name;
        
        const actions = document.createElement('div');
        
        const editBtn = document.createElement('button');
        editBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'me-1');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => editEngineer(eng));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => deleteEngineer(eng.name));
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        nameRow.appendChild(name);
        nameRow.appendChild(actions);
        
        const workplaces = document.createElement('small');
        workplaces.classList.add('text-muted');
        workplaces.textContent = `Workplaces: ${eng.workplaces.join(', ')}`;
        
        cardBody.appendChild(nameRow);
        cardBody.appendChild(workplaces);
        
        card.appendChild(cardBody);
        engineersList.appendChild(card);
    });
}

// Edit engineer
function editEngineer(engineer) {
    const nameInput = document.getElementById('engineerName');
    if (!nameInput) return;
    
    nameInput.value = engineer.name;
    
    // Uncheck all workplaces
    document.querySelectorAll('.workplace-check').forEach(check => {
        check.checked = false;
    });
    
    // Check relevant workplaces
    engineer.workplaces.forEach(workplace => {
        const checkId = `check-${workplace.replace(/\s+/g, '-').toLowerCase()}`;
        const checkbox = document.getElementById(checkId);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addEngineerModal'));
    modal.show();
}

// Save engineer
function saveEngineer() {
    const nameInput = document.getElementById('engineerName');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) {
        showAlert('Please enter engineer name', 'warning');
        return;
    }
    
    const workplaces = [];
    document.querySelectorAll('.workplace-check:checked').forEach(check => {
        workplaces.push(check.value);
    });
    
    if (workplaces.length === 0) {
        showAlert('Please select at least one workplace', 'warning');
        return;
    }
    
    fetch('/api/engineers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            workplaces
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Reset form
            document.getElementById('engineerForm').reset();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEngineerModal'));
            modal.hide();
            
            // Show success message
            showAlert('Engineer saved successfully!', 'success');
            
            // Reload engineers
            loadEngineers();
        }
    })
    .catch(error => {
        console.error('Error saving engineer:', error);
        showAlert('Failed to save engineer. Please try again.', 'danger');
    });
}

// Delete engineer
function deleteEngineer(name) {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        fetch(`/api/engineers/${name}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(`Engineer "${name}" deleted successfully`, 'success');
                loadEngineers();
            }
        })
        .catch(error => {
            console.error('Error deleting engineer:', error);
            showAlert('Failed to delete engineer. Please try again.', 'danger');
        });
    }
}

// Generate schedules for each workplace
function generateCalendars() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (!monthSelect || !yearSelect) return;
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // For each workplace, generate the table
    document.querySelectorAll('[id^="schedule-"]').forEach(container => {
        if (!container) return;
        
        const workplaceId = container.id.replace('schedule-', '');
        const workplaceName = workplaceId.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
        
        // Create table
        const table = document.createElement('table');
        table.className = 'table table-bordered';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Day', 'Shift 1', 'Shift 2', 'Shift 3'];
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            
            const row = document.createElement('tr');
            if (isWeekend) {
                row.classList.add('table-light');
            }
            
            // Day column
            const dayCell = document.createElement('td');
            dayCell.textContent = `${day} - ${date.toLocaleDateString('en-US', { weekday: 'short' })}`;
            row.appendChild(dayCell);
            
            // Shift columns
            for (let shift = 1; shift <= 3; shift++) {
                const cell = document.createElement('td');
                
                const select = document.createElement('select');
                select.className = 'form-select engineer-select';
                select.dataset.day = day;
                select.dataset.shift = `shift${shift}`;
                select.dataset.workplace = workplaceName;
                
                // Empty option
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '-- Select Engineer --';
                select.appendChild(emptyOption);
                
                // Filter engineers who can work in this workplace
                if (window.engineers) {
                    window.engineers.filter(eng => eng.workplaces.includes(workplaceName))
                        .forEach(eng => {
                            const option = document.createElement('option');
                            option.value = eng.name;
                            option.textContent = eng.name;
                            select.appendChild(option);
                        });
                }
                
                cell.appendChild(select);
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
    });
    
    // Load schedule for this month/year
    loadSchedule(year, month);
}

// Load schedule from API
function loadSchedule(year, month) {
    fetch(`/api/schedule?year=${year}&month=${month}`)
        .then(response => response.json())
        .then(data => {
            window.currentSchedule = data || {};
            
            // Fill in the select fields
            document.querySelectorAll('.engineer-select').forEach(select => {
                const workplace = select.dataset.workplace;
                const day = select.dataset.day;
                const shift = select.dataset.shift;
                
                if (window.currentSchedule[workplace] && 
                    window.currentSchedule[workplace][day] && 
                    window.currentSchedule[workplace][day][shift]) {
                    select.value = window.currentSchedule[workplace][day][shift];
                } else {
                    select.value = '';
                }
            });
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
        });
}

// Save schedule
function saveSchedule() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (!monthSelect || !yearSelect) return;
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    // Collect schedule data
    const workplaces = {};
    
    document.querySelectorAll('.engineer-select').forEach(select => {
        if (select.value) {
            const workplace = select.dataset.workplace;
            const day = select.dataset.day;
            const shift = select.dataset.shift;
            
            if (!workplaces[workplace]) {
                workplaces[workplace] = {};
            }
            
            if (!workplaces[workplace][day]) {
                workplaces[workplace][day] = {};
            }
            
            workplaces[workplace][day][shift] = select.value;
        }
    });
    
    fetch('/api/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            year,
            month,
            workplaces
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showAlert('Schedule saved successfully!', 'success');
            loadSchedule(year, month);
        }
    })
    .catch(error => {
        console.error('Error saving schedule:', error);
        showAlert('Failed to save schedule. Please try again.', 'danger');
    });
}

// Generate Excel files
function generateExcel() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (!monthSelect || !yearSelect) return;
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-card">
            <div class="d-flex align-items-center">
                <div class="spinner-border text-primary me-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>
                    <h5 class="mb-0">Generating Excel Files</h5>
                    <small>Please wait, this may take a few moments...</small>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    // Use setTimeout to prevent UI freezing
    setTimeout(() => {
        fetch('/api/generate_excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                year,
                month
            })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('No schedule data found for the selected period. Please save your schedule first.');
                }
                throw new Error('Failed to generate Excel files');
            }
            return response.json();
        })
        .then(data => {
            // Remove loading indicator
            document.body.removeChild(loadingDiv);
            
            if (data.status === 'success') {
                const downloadList = document.getElementById('downloadList');
                if (!downloadList) return;
                
                downloadList.innerHTML = '';
                
                data.files.forEach(file => {
                    const li = document.createElement('li');
                    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                    
                    const fileName = document.createElement('span');
                    fileName.textContent = file;
                    
                    const downloadLink = document.createElement('a');
                    downloadLink.href = `/api/download/${file}`;
                    downloadLink.classList.add('btn', 'btn-sm', 'btn-outline-primary');
                    downloadLink.innerHTML = '<i class="fas fa-download me-1"></i> Download';
                    downloadLink.download = file;
                    
                    li.appendChild(fileName);
                    li.appendChild(downloadLink);
                    downloadList.appendChild(li);
                });
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('excelGeneratedModal'));
                modal.show();
            }
        })
        .catch(error => {
            // Remove loading indicator
            if (document.body.contains(loadingDiv)) {
                document.body.removeChild(loadingDiv);
            }
            
            console.error('Error generating Excel files:', error);
            showAlert('Failed to generate Excel files. Please make sure you have saved the schedule.', 'danger');
        });
    }, 50); // Small delay to allow the UI to update
}

// Show alert message
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 5000);
    }
}

// Auto-assign engineers to shifts
function autoAssignEngineers() {
    // Get month and year for the schedule
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (!monthSelect || !yearSelect) return;
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // If no engineers, show message
    if (!window.engineers || window.engineers.length === 0) {
        showAlert('Please add engineers before auto-assigning shifts.', 'warning');
        return;
    }
    
    // Show confirmation dialog
    if (!confirm('This will automatically assign engineers to all empty shifts based on their workplace eligibility. Continue?')) {
        return;
    }
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-card">
            <div class="d-flex align-items-center">
                <div class="spinner-border text-primary me-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>
                    <h5 class="mb-0">Assigning Engineers</h5>
                    <small>Please wait, this may take a few moments...</small>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    // Track engineer assignments to distribute workload evenly
    const engineerAssignments = {};
    window.engineers.forEach(eng => {
        engineerAssignments[eng.name] = 0;
    });
    
    // Prepare workplace elements and data for batch processing
    const workplaceElements = Array.from(document.querySelectorAll('[id^="schedule-"]'));
    const workplaceData = workplaceElements.map(workplaceElem => {
        const workplaceId = workplaceElem.id.replace('schedule-', '');
        const workplaceName = workplaceId.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
        
        // Filter engineers who can work in this workplace
        const eligibleEngineers = window.engineers.filter(eng => 
            eng.workplaces.includes(workplaceName)
        );
        
        return {
            element: workplaceElem,
            name: workplaceName,
            eligible: eligibleEngineers
        };
    }).filter(wp => wp.eligible.length > 0);
    
    // Break processing into chunks to prevent browser freezing
    const batchSize = 5; // Process 5 days at a time
    let currentWorkplaceIndex = 0;
    let currentDay = 1;
    
    // Process in batches
    function processBatch() {
        // If we've processed all workplaces, show results
        if (currentWorkplaceIndex >= workplaceData.length) {
            // Remove loading indicator
            document.body.removeChild(loadingDiv);
            
            // Show results
            showAssignmentResults(engineerAssignments);
            return;
        }
        
        const workplace = workplaceData[currentWorkplaceIndex];
        
        // Process a batch of days
        const startDay = currentDay;
        const endDay = Math.min(startDay + batchSize - 1, daysInMonth);
        
        for (let day = startDay; day <= endDay; day++) {
            for (let shift = 1; shift <= 3; shift++) {
                // Find the select element for this workplace, day, and shift
                const selectElem = workplace.element.querySelector(
                    `select[data-day="${day}"][data-shift="shift${shift}"][data-workplace="${workplace.name}"]`
                );
                
                // If select is not found or already has a value, skip
                if (!selectElem || selectElem.value !== '') {
                    continue;
                }
                
                // Sort eligible engineers by number of assignments (ascending)
                const sortedEngineers = [...workplace.eligible].sort((a, b) => {
                    return engineerAssignments[a.name] - engineerAssignments[b.name];
                });
                
                // Assign the engineer with fewest assignments
                if (sortedEngineers.length > 0) {
                    const assignedEngineer = sortedEngineers[0];
                    selectElem.value = assignedEngineer.name;
                    engineerAssignments[assignedEngineer.name]++;
                }
            }
        }
        
        // Update progress for next batch
        currentDay = endDay + 1;
        if (currentDay > daysInMonth) {
            currentDay = 1;
            currentWorkplaceIndex++;
        }
        
        // Process next batch asynchronously
        setTimeout(processBatch, 0);
    }
    
    // Start batch processing
    setTimeout(processBatch, 0);
}

// Show assignment results in modal
function showAssignmentResults(engineerAssignments) {
    // Show success message
    showAlert('Engineers have been automatically assigned to shifts!', 'success');
    
    // Show detailed modal with assignments
    const summaryContent = `
        <h5>Assignment Summary</h5>
        <p>Engineers have been assigned to shifts based on their workplace eligibility and to balance workload.</p>
        <div class="table-responsive">
            <table class="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>Engineer</th>
                        <th>Assigned Shifts</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(engineerAssignments)
                        .filter(([_, count]) => count > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, count]) => `
                            <tr>
                                <td>${name}</td>
                                <td>${count}</td>
                            </tr>
                        `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Create a modal to display assignment summary
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal fade';
    modalDiv.id = 'assignmentSummaryModal';
    modalDiv.tabIndex = -1;
    modalDiv.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title"><i class="fas fa-magic me-2"></i>Auto-Assignment Complete</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${summaryContent}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Append to body if it doesn't exist already
    if (!document.getElementById('assignmentSummaryModal')) {
        document.body.appendChild(modalDiv);
    } else {
        document.getElementById('assignmentSummaryModal').innerHTML = modalDiv.innerHTML;
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('assignmentSummaryModal'));
    modal.show();
}