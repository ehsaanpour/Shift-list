# Shift Scheduler

A web-based application for scheduling shifts across 4 workplaces, built with FastAPI.

## Features

- Schedule shifts for staff across 4 workplaces:
  - Studio Hispan
  - Studio Press
  - Nodal
  - Engineer Room
- Add and remove engineers
- Assign engineers to specific workplaces
- Schedule shifts in a user-friendly interface
- View schedules in online tables
- Generate Excel files with beautiful templates
- 3 shifts per day for each workplace

## Installation

1. Clone this repository.

2. Create a virtual environment (recommended):
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install the requirements:
   ```
   pip install -r requirements.txt
   ```

5. Run the application:
   ```
   python app.py
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Usage

### Managing Engineers

1. Click the "Add Engineer" button in the Engineers panel.
2. Enter the engineer's name.
3. Select the workplaces they can work at.
4. Click "Save".

### Scheduling Shifts

1. Select the month and year from the dropdown menus.
2. Click on a workplace tab to view its schedule.
3. For each day and shift, select an engineer from the dropdown menu.
4. Click "Save Schedule" to save your changes.

### Viewing Online Tables

1. Click the "Online Table" button to view the schedule in a table format.
2. The table displays all shifts for each day of the month.
3. Use the print button to print the schedules.

### Generating Excel Files

1. Click the "Generate Excel" button to create Excel files.
2. A popup will appear with download links for each workplace.
3. Click on the download links to download the Excel files.

## Project Structure

- `app.py`: Main FastAPI application
- `templates/`: HTML templates
  - `base.html`: Base template
  - `index.html`: Main page template
- `static/`: Static files
  - `css/`: CSS stylesheets
  - `js/`: JavaScript files
- `data/`: Data storage directory
  - Engineers and schedules are stored as JSON files
  - Generated Excel files are saved here

## Technologies Used

- Backend: FastAPI
- Frontend: HTML, CSS, JavaScript
- UI Framework: Bootstrap 5
- Excel Generation: openpyxl

## License

MIT