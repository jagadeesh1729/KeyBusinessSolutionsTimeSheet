
import database from './config/database';

async function checkColumns() {
  try {
    console.log('Checking columns for table "projects"...');
    const rows = await database.query('SHOW COLUMNS FROM projects');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error checking columns:', error);
    process.exit(1);
  }
}

checkColumns();
