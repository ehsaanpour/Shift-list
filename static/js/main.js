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

// Variables to store pattern data
let currentPattern = {};
let currentPatternWorkplace = '';

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
    
    // Clear All Shifts button
    const clearShiftsBtn = document.getElementById('btnClearShifts');
    if (clearShiftsBtn) {
        clearShiftsBtn.addEventListener('click', clearAllShifts);
    }
    
    // Auto-Assign Engineers button
    const autoAssignBtn = document.getElementById('btnAutoAssign');
    if (autoAssignBtn) {
        autoAssignBtn.addEventListener('click', autoAssignEngineers);
    }
    
    // Import Pattern buttons
    const importPatternBtns = document.querySelectorAll('.import-pattern-btn');
    importPatternBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const workplace = this.dataset.workplace;
            openImportPatternModal(workplace);
        });
    });
    
    // Pattern file input change
    const patternFileInput = document.getElementById('patternFile');
    if (patternFileInput) {
        patternFileInput.addEventListener('change', function() {
            const previewBtn = document.getElementById('btnPreviewPattern');
            const applyBtn = document.getElementById('btnApplyPattern');
            
            if (this.files.length > 0) {
                previewBtn.disabled = false;
            } else {
                previewBtn.disabled = true;
                applyBtn.disabled = true;
                
                // Hide preview
                const previewSection = document.getElementById('patternPreview');
                previewSection.classList.add('d-none');
            }
        });
    }
    
    // Preview Pattern button
    const previewPatternBtn = document.getElementById('btnPreviewPattern');
    if (previewPatternBtn) {
        previewPatternBtn.addEventListener('click', previewPattern);
    }
    
    // Apply Pattern button
    const applyPatternBtn = document.getElementById('btnApplyPattern');
    if (applyPatternBtn) {
        applyPatternBtn.addEventListener('click', applyPattern);
    }
    
    // Month and year select
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (monthSelect && yearSelect) {
        monthSelect.addEventListener('change', generateCalendars);
        yearSelect.addEventListener('change', generateCalendars);
    }
    
    // Save limitations button
    const saveLimitationsBtn = document.getElementById('btnSaveLimitations');
    if (saveLimitationsBtn) {
        saveLimitationsBtn.addEventListener('click', window.saveLimitations);
    }
}

// Load engineers from API
function loadEngineers() {
    fetch('/api/engineers')
        .then(response => response.json())
        .then(data => {
            // Ensure each engineer has a limitations property
            window.engineers = data.map(eng => {
                // Ensure limitations are properly structured with string keys
                const formattedLimitations = {};
                if (eng.limitations) {
                    Object.keys(eng.limitations).forEach(day => {
                        // Ensure day is stored as string
                        formattedLimitations[String(day)] = eng.limitations[day];
                    });
                }
                
                return {
                    ...eng,
                    limitations: formattedLimitations
                };
            });
            
            console.log('Loaded engineers with formatted limitations:', window.engineers);
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
    
    // Find existing engineer to preserve limitations
    let existingLimitations = {};
    if (window.engineers) {
        const existingEngineer = window.engineers.find(eng => eng.name === name);
        if (existingEngineer && existingEngineer.limitations) {
            existingLimitations = existingEngineer.limitations;
        }
    }
    
    fetch('/api/engineers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            workplaces,
            limitations: existingLimitations
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
    if (!confirm('This will automatically assign engineers to all empty shifts based on their workplace eligibility and limitations. Continue?')) {
        return;
    }
    
    // Debug engineers data
    console.log('Engineers before auto-assignment:', JSON.stringify(window.engineers));
    
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
    
    console.log("Starting auto-assignment with engineers:", window.engineers);
    
    // Prepare workplace elements and data for batch processing
    const workplaceElements = Array.from(document.querySelectorAll('[id^="schedule-"]'));
    const workplaceData = workplaceElements.map(workplaceElem => {
        const workplaceId = workplaceElem.id.replace('schedule-', '');
        const workplaceName = workplaceId.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
        
        // Filter engineers who can work in this workplace
        const eligibleEngineers = window.engineers.filter(eng => 
            eng.workplaces && eng.workplaces.includes(workplaceName)
        );
        
        console.log(`Workplace: ${workplaceName}, Eligible Engineers: ${eligibleEngineers.map(e => e.name).join(', ')}`);
        
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
    let totalAssignments = 0;
    
    // Process in batches
    function processBatch() {
        // If we've processed all workplaces, show results
        if (currentWorkplaceIndex >= workplaceData.length) {
            // Remove loading indicator
            document.body.removeChild(loadingDiv);
            
            console.log(`Auto-assignment complete. Total assignments: ${totalAssignments}`);
            
            // Show results
            showAssignmentResults(engineerAssignments);
            return;
        }
        
        const workplace = workplaceData[currentWorkplaceIndex];
        console.log(`Processing workplace: ${workplace.name}, days ${currentDay} to ${Math.min(currentDay + batchSize - 1, daysInMonth)}`);
        
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
                
                const dayStr = String(day);
                const shiftKey = `shift${shift}`;
                
                // Filter eligible engineers considering their limitations
                const availableEngineers = workplace.eligible.filter(eng => {
                    // Debug individual engineer limitations
                    console.log(`Checking engineer ${eng.name} for ${workplace.name}, day ${day}, ${shiftKey}`);
                    console.log(`Engineer limitations:`, eng.limitations);
                    
                    // Check if the engineer has limitations for this day and shift
                    let hasLimitation = false;
                    
                    if (eng.limitations) {
                        // Check limitations with day as string (e.g., "1", "2", etc.)
                        if (eng.limitations[dayStr] && 
                            Array.isArray(eng.limitations[dayStr]) && 
                            eng.limitations[dayStr].includes(shiftKey)) {
                            hasLimitation = true;
                        }
                        
                        // Also check with day as number (for backward compatibility)
                        if (eng.limitations[day] && 
                            Array.isArray(eng.limitations[day]) && 
                            eng.limitations[day].includes(shiftKey)) {
                            hasLimitation = true;
                        }
                    }
                    
                    if (hasLimitation) {
                        console.log(`Engineer ${eng.name} has limitation for day ${day}, ${shiftKey}`);
                    } else {
                        console.log(`Engineer ${eng.name} is available for day ${day}, ${shiftKey}`);
                    }
                    
                    return !hasLimitation;
                });
                
                console.log(`Available engineers for ${workplace.name}, day ${day}, ${shiftKey}:`, 
                    availableEngineers.map(e => e.name).join(', '));
                
                // If no available engineers after filtering by limitations, skip
                if (availableEngineers.length === 0) {
                    console.log(`No available engineers for ${workplace.name}, day ${day}, ${shiftKey}`);
                    continue;
                }
                
                // Sort available engineers by number of assignments (ascending)
                const sortedEngineers = [...availableEngineers].sort((a, b) => {
                    return engineerAssignments[a.name] - engineerAssignments[b.name];
                });
                
                // Assign the engineer with fewest assignments
                if (sortedEngineers.length > 0) {
                    const assignedEngineer = sortedEngineers[0];
                    selectElem.value = assignedEngineer.name;
                    engineerAssignments[assignedEngineer.name]++;
                    totalAssignments++;
                    console.log(`Assigned ${assignedEngineer.name} to ${workplace.name}, day ${day}, ${shiftKey}`);
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
    // Verify we have assignment data to display
    console.log("Engineer Assignments:", engineerAssignments);
    
    // Calculate total assignments
    const totalAssignments = Object.values(engineerAssignments).reduce((sum, count) => sum + count, 0);
    
    // Filter only engineers that were assigned (count > 0)
    const assignedEngineers = Object.entries(engineerAssignments)
        .filter(([_, count]) => count > 0);
    
    console.log("Filtered Assigned Engineers:", assignedEngineers);
    console.log("Total Assignments:", totalAssignments);
    
    // Show success message with count
    if (totalAssignments > 0) {
        showAlert(`Successfully assigned ${totalAssignments} shifts to ${assignedEngineers.length} engineers!`, 'success');
    } else {
        showAlert('No shifts could be assigned. This may be due to limitations or workplace eligibility issues.', 'warning');
    }
    
    // Create table rows for each engineer
    const tableRows = assignedEngineers
        .sort((a, b) => b[1] - a[1]) // Sort by count (highest first)
        .map(([name, count]) => {
            return `
                <tr>
                    <td>${name}</td>
                    <td>${count}</td>
                </tr>
            `;
        }).join('');
    
    // Create table with assignment data
    const tableContent = assignedEngineers.length > 0 
        ? `
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>Engineer</th>
                            <th>Assigned Shifts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `
        : `<div class="alert alert-warning">
            <p><strong>No shifts were assigned.</strong></p>
            <p>Possible reasons:</p>
            <ul>
                <li>Engineers have too many limitations set for this month</li>
                <li>Engineers are not assigned to the required workplaces</li>
                <li>All shifts are already filled</li>
            </ul>
            <p>Try adjusting engineer limitations or workplace assignments and try again.</p>
          </div>`;
    
    // Show detailed modal with assignments
    const summaryContent = `
        <h5>Assignment Summary</h5>
        <p>Engineers have been assigned to shifts based on their workplace eligibility and limitations.</p>
        ${tableContent}
        ${totalAssignments > 0 ? `
        <div class="alert alert-warning mt-3">
            <i class="fas fa-exclamation-triangle me-2"></i> Remember to save the schedule to persist these assignments!
        </div>
        ` : ''}
    `;
    
    // Update modal content or create new modal
    const existingModal = document.getElementById('assignmentSummaryModal');
    if (existingModal) {
        // Update existing modal
        const modalBody = existingModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = summaryContent;
        }
        
        // Update footer to include Clear All button
        const modalFooter = existingModal.querySelector('.modal-footer');
        if (modalFooter) {
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-danger" onclick="clearAllShifts()">
                    <i class="fas fa-eraser me-1"></i> Clear All
                </button>
                <button type="button" class="btn btn-primary" onclick="saveSchedule()">
                    <i class="fas fa-save me-1"></i> Save Schedule
                </button>
            `;
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(existingModal);
        modal.show();
    } else {
        // Create a new modal
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
                        <button type="button" class="btn btn-danger" onclick="clearAllShifts()">
                            <i class="fas fa-eraser me-1"></i> Clear All
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveSchedule()">
                            <i class="fas fa-save me-1"></i> Save Schedule
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalDiv);
        
        // Show the modal
        const modal = new bootstrap.Modal(modalDiv);
        modal.show();
    }
}

// Function to clear all shifts in the schedule
function clearAllShifts() {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to clear all shifts? This will reset all assignments.')) {
        return;
    }
    
    // Get all shift selector elements
    const shiftSelectors = document.querySelectorAll('.engineer-select');
    
    // Count how many shifts are currently assigned
    let assignedShiftsCount = 0;
    shiftSelectors.forEach(select => {
        if (select.value !== '') {
            assignedShiftsCount++;
        }
    });
    
    // If no shifts are assigned, show a message
    if (assignedShiftsCount === 0) {
        showAlert('No shifts are currently assigned.', 'info');
        return;
    }
    
    // Reset all shift selectors to empty
    shiftSelectors.forEach(select => {
        select.value = '';
    });
    
    // Show success message
    showAlert(`Successfully cleared ${assignedShiftsCount} shift assignments. Don't forget to save your changes!`, 'success');
    
    // Reset the current schedule in memory
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (monthSelect && yearSelect) {
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        window.currentSchedule = {};
    }
}

// Open the Import Pattern modal
function openImportPatternModal(workplace) {
    // Store the current workplace
    currentPatternWorkplace = workplace;
    
    // Update modal title
    const workplaceNameElement = document.getElementById('patternWorkplaceName');
    if (workplaceNameElement) {
        workplaceNameElement.textContent = workplace;
    }
    
    // Reset form
    const patternForm = document.getElementById('patternUploadForm');
    if (patternForm) {
        patternForm.reset();
    }
    
    // Reset buttons
    const previewBtn = document.getElementById('btnPreviewPattern');
    const applyBtn = document.getElementById('btnApplyPattern');
    if (previewBtn) previewBtn.disabled = true;
    if (applyBtn) applyBtn.disabled = true;
    
    // Hide preview
    const previewSection = document.getElementById('patternPreview');
    if (previewSection) {
        previewSection.classList.add('d-none');
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('importPatternModal'));
    modal.show();
}

// Preview the pattern from uploaded Excel file
function previewPattern() {
    const fileInput = document.getElementById('patternFile');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showAlert('Please select an Excel file first.', 'warning');
        return;
    }
    
    // Show loading state
    const previewBtn = document.getElementById('btnPreviewPattern');
    const originalText = previewBtn.innerHTML;
    previewBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    previewBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch('/api/pattern/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error uploading file. Server returned ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            // Store the pattern
            currentPattern = data.pattern;
            
            // Generate preview
            generatePatternPreview(data.pattern);
            
            // Enable apply button
            const applyBtn = document.getElementById('btnApplyPattern');
            applyBtn.disabled = false;
        } else {
            throw new Error('Failed to process pattern file');
        }
    })
    .catch(error => {
        console.error('Error processing pattern file:', error);
        showAlert('Failed to process pattern file: ' + error.message, 'danger');
    })
    .finally(() => {
        // Reset button state
        previewBtn.innerHTML = originalText;
        previewBtn.disabled = false;
    });
}

// Generate a preview of the pattern data
function generatePatternPreview(pattern) {
    const previewSection = document.getElementById('patternPreview');
    const previewTable = document.getElementById('patternPreviewTable');
    
    if (!previewSection || !previewTable) return;
    
    // Clear previous preview
    const tbody = previewTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Get current month and year to display correct day labels
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearSelect').value);
    
    // Create rows for each day
    Object.keys(pattern).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
        const date = new Date(year, month - 1, parseInt(day));
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayLabel = `${day} - ${dayOfWeek}`;
        
        const row = document.createElement('tr');
        
        // Day column
        const dayCell = document.createElement('td');
        dayCell.textContent = dayLabel;
        row.appendChild(dayCell);
        
        // Shift columns
        for (let shift = 1; shift <= 3; shift++) {
            const shiftKey = `shift${shift}`;
            const cell = document.createElement('td');
            cell.textContent = pattern[day][shiftKey] || '—';
            row.appendChild(cell);
        }
        
        tbody.appendChild(row);
    });
    
    // Show the preview section
    previewSection.classList.remove('d-none');
}

// Apply the pattern to the schedule
function applyPattern() {
    if (!currentPattern || !currentPatternWorkplace) {
        showAlert('No pattern data available to apply.', 'warning');
        return;
    }
    
    // Get checkbox values
    const overrideExisting = document.getElementById('overrideExisting').checked;
    const respectLimitations = document.getElementById('respectLimitations').checked;
    
    // Show loading state
    const applyBtn = document.getElementById('btnApplyPattern');
    const originalText = applyBtn.innerHTML;
    applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Applying...';
    applyBtn.disabled = true;
    
    // Find the workplace tab content
    const workplaceId = currentPatternWorkplace.replace(/\s+/g, '-').toLowerCase();
    const workplaceElement = document.getElementById(`schedule-${workplaceId}`);
    
    if (!workplaceElement) {
        showAlert(`Could not find schedule for ${currentPatternWorkplace}`, 'danger');
        applyBtn.innerHTML = originalText;
        applyBtn.disabled = false;
        return;
    }
    
    // Count assignments
    let appliedCount = 0;
    let skippedDueToLimitations = 0;
    let skippedDueToExisting = 0;
    
    // For each day in the pattern
    Object.keys(currentPattern).forEach(day => {
        // For each shift in the day
        Object.keys(currentPattern[day]).forEach(shift => {
            const engineerName = currentPattern[day][shift];
            
            // Skip if no engineer assigned in pattern
            if (!engineerName) return;
            
            // Find the select element for this day and shift
            const selectElem = workplaceElement.querySelector(
                `select[data-day="${day}"][data-shift="${shift}"][data-workplace="${currentPatternWorkplace}"]`
            );
            
            if (!selectElem) return;
            
            // Check if there's already an assignment
            if (selectElem.value && !overrideExisting) {
                skippedDueToExisting++;
                return;
            }
            
            // Find engineer in options
            let engineerOption = null;
            for (let i = 0; i < selectElem.options.length; i++) {
                if (selectElem.options[i].textContent === engineerName) {
                    engineerOption = selectElem.options[i];
                    break;
                }
            }
            
            // Skip if engineer not found
            if (!engineerOption) return;
            
            // Check limitations if required
            if (respectLimitations) {
                // Find the engineer object
                const engineer = window.engineers.find(eng => eng.name === engineerName);
                
                // Skip if engineer not found
                if (!engineer) return;
                
                // Check if the engineer has limitations for this day and shift
                if (engineer.limitations && 
                    (engineer.limitations[day] || engineer.limitations[`${day}`]) &&
                    ((engineer.limitations[day] && engineer.limitations[day].includes(shift)) ||
                     (engineer.limitations[`${day}`] && engineer.limitations[`${day}`].includes(shift)))) {
                    skippedDueToLimitations++;
                    return;
                }
            }
            
            // Apply the assignment
            selectElem.value = engineerOption.value;
            appliedCount++;
        });
    });
    
    // Show results
    const message = `Applied ${appliedCount} assignments from the pattern.` +
        (skippedDueToLimitations > 0 ? ` Skipped ${skippedDueToLimitations} due to limitations.` : '') +
        (skippedDueToExisting > 0 ? ` Skipped ${skippedDueToExisting} due to existing assignments.` : '');
    
    showAlert(message, 'success');
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('importPatternModal')).hide();
    
    // Reset button state
    applyBtn.innerHTML = originalText;
    applyBtn.disabled = false;
}

// Make functions available globally
window.autoAssignEngineers = autoAssignEngineers;
window.saveSchedule = saveSchedule;
window.clearAllShifts = clearAllShifts;
window.openImportPatternModal = openImportPatternModal;
window.previewPattern = previewPattern;
window.applyPattern = applyPattern;