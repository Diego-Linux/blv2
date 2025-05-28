require('dotenv').config();
const database = require('../models/connection');

async function dropAllTables() {
  try {
    await database.authenticate();
    console.log('Conexão com o banco de dados estabelecida.');

    // 1) Desabilitar foreign key checks
    await database.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Foreign key checks desabilitados.');

    // 2) Pegar todas as tabelas no banco
    const [results] = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE();
    `);

    // 3) Dropar todas as tabelas
    for (const row of results) {
      const table = row['table_name'];
      console.log(`Dropping table ${table}...`);
      await database.query(`DROP TABLE IF EXISTS \`${table}\`;`);
    }
    console.log('Todas as tabelas foram droppadas.');

    // 4) Reabilitar foreign key checks
    await database.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key checks reabilitados.');
    
  } catch (error) {
    console.error('Erro ao dropar tabelas:', error);
  } finally {
    await database.close();
    console.log('Conexão encerrada.');
  }
}

dropAllTables();
