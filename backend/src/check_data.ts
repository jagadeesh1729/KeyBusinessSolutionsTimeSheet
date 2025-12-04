
import database from './config/database';

async function checkData() {
  try {
    console.log('Checking data for table "projects"...');
    const rows = await database.query('SELECT id, name, code FROM projects');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error checking data:', error);
    process.exit(1);
  }
}

checkData();
