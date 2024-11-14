const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function createUsers() {
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const users = [
            { name: 'Admin', email: 'admin@gmail.com', image:'user.png',isAdmin: true, password: hashedPassword },
            { name: 'Diego', email: 'diego@gmail.com',image:'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Elias', email: 'elias@gmail.com',image:'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Jean', email: 'jean@gmail.com',image:'user.png',  isAdmin: false, password: hashedPassword },
            { name: 'Jose', email: 'jose@gmail.com', image:'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Reny', email: 'reny@gmail.com', image:'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Roger', email: 'roger@gmail.com',image:'user.png',  isAdmin: false, password: hashedPassword },
        ];
        for (const userData of users) {
            const user = await User.create(userData);
            console.log(`Usuário ${user.name} criado com sucesso!`);
        }
    } catch (error) {
        console.error('Erro ao criar os usuários:', error);
    }
}

createUsers();
