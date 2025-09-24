const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let employees = [];

function addEmployee() {
  rl.question('Enter employee name: ', (name) => {
    rl.question('Enter employee ID: ', (id) => {
      // Basic validation to prevent adding empty employees
      if (name && id) {
        employees.push({ name, id });
        console.log(`\nEmployee ${name} (ID: ${id}) added successfully.`);
      } else {
        console.log('\nName and ID cannot be empty.');
      }
      displayMenu(); // Show the menu again
    });
  });
}

function listEmployees() {
  if (employees.length === 0) {
    console.log('\nNo employees found.');
  } else {
    console.log('\n--- Employee List ---');
    employees.forEach((employee, index) => {
      console.log(`${index + 1}. Name: ${employee.name}, ID: ${employee.id}`);
    });
    console.log('---------------------');
  }
  displayMenu(); 
}

function removeEmployee() {
  rl.question('Enter employee ID to remove: ', (idToRemove) => {
    const index = employees.findIndex(employee => employee.id === idToRemove);

    if (index !== -1) {
      const removedEmployee = employees.splice(index, 1);
      console.log(`\nEmployee ${removedEmployee[0].name} (ID: ${removedEmployee[0].id}) removed successfully.`);
    } else {
      console.log('\nEmployee with that ID not found.');
    }
    displayMenu();
  });
}

function exitApp() {
  console.log('\nExiting the application. Goodbye!');
  rl.close();
}

function displayMenu() {
  console.log('\n===== Employee Management System =====');
  console.log('1. Add Employee');
  console.log('2. List Employees');
  console.log('3. Remove Employee');
  console.log('4. Exit');

  rl.question('Enter your choice: ', (choice) => {
    switch (choice.trim()) {
      case '1':
        addEmployee();
        break;
      case '2':
        listEmployees();
        break;
      case '3':
        removeEmployee();
        break;
      case '4':
        exitApp();
        break;
      default:
        console.log('\nInvalid choice. Please enter a number from 1 to 4.');
        displayMenu();
        break;
    }
  });
}

// Step 6: Start the Application
console.log('Welcome to the Employee Management System!');
displayMenu();