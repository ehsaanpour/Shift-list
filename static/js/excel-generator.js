/**
 * Excel Generator Script
 * This file handles the functionality for the Generate Excel button 
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Excel Generator script loaded');
    
    // Get the Generate Excel button
    const generateBtn = document.getElementById('btnGenerate');
    if (generateBtn) {
        console.log('Generate Excel button found');
        
        // Remove existing event listeners by cloning the button
        const newBtn = generateBtn.cloneNode(true);
        generateBtn.parentNode.replaceChild(newBtn, generateBtn);
        
        // Add new event listener
        newBtn.addEventListener('click', function() {
            console.log('Generate Excel button clicked');
            generateExcelFiles();
        });
    } else {
        console.error('Generate Excel button not found');
    }
    
    // Function to generate Excel files
    function generateExcelFiles() {
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');
        
        if (!monthSelect || !yearSelect) {
            console.error('Month or year select not found');
            return;
        }
        
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        
        console.log(`Generating Excel files for ${month}/${year}`);
        
        // Make API call
        fetch('/api/generate_excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                year: year,
                month: month
            })
        })
        .then(response => {
            console.log('API response received', response);
            if (!response.ok) {
                throw new Error('Failed to generate Excel files');
            }
            return response.json();
        })
        .then(data => {
            console.log('API data received', data);
            if (data.status === 'success') {
                const downloadList = document.getElementById('downloadList');
                if (!downloadList) {
                    console.error('Download list not found');
                    return;
                }
                
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
                if (modal) {
                    modal.show();
                } else {
                    console.error('Excel Generated Modal not found');
                    alert('Excel files generated successfully! Check the data directory.');
                }
            } else {
                console.error('API returned non-success status', data);
                alert('Failed to generate Excel files. Please make sure you have saved the schedule.');
            }
        })
        .catch(error => {
            console.error('Error generating Excel files:', error);
            alert('Failed to generate Excel files. Please make sure you have saved the schedule.');
        });
    }
}); 