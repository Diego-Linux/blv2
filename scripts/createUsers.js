require('dotenv').config(); // carrega .env logo no início
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2; // importa e usa direto aqui
const User = require('../models/user');
const database = require('../models/connection'); // se tiver conexão separada

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

async function uploadToCloudinary(localFilePath) {
    try {
        if (!fs.existsSync(localFilePath)) {
            console.error(`Arquivo não encontrado: ${localFilePath}`);
            return null;
        }

        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'uploads',
        });
        return result.secure_url;
    } catch (err) {
        console.error('Erro ao fazer upload para o Cloudinary:', err.message);
        return null;
    }
}

async function createUsers() {
    try {
        await database.authenticate();
        console.log('✅ Conexão com o banco de dados estabelecida.');

        const hashedPassword = await bcrypt.hash('123456', 10);
        const users = [
            { name: 'Admin', email: 'admin@gmail.com', image: 'user.png', isAdmin: true, password: hashedPassword },
            { name: 'Diego', email: 'diego@gmail.com', image: 'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Elias', email: 'elias@gmail.com', image: 'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Jean', email: 'jean@gmail.com', image: 'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Jose', email: 'jose@gmail.com', image: 'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Reny', email: 'reny@gmail.com', image: 'user.png', isAdmin: false, password: hashedPassword },
            { name: 'Roger', email: 'roger@gmail.com', image: 'user.png', isAdmin: false, password: hashedPassword },
        ];

        for (const userData of users) {
            const localImagePath = path.join(__dirname, '../images/', userData.image);
            console.log(`Tentando upload da imagem: ${localImagePath}`);

            const imageUrl = await uploadToCloudinary(localImagePath);

            if (!imageUrl) {
                console.log(`❌ Falha ao enviar imagem do usuário ${userData.name}. Pulando...`);
                continue;
            }

            await User.create({
                ...userData,
                image: imageUrl,
            });

            console.log(`✅ Usuário ${userData.name} criado com sucesso!`);
        }
    } catch (error) {
        console.error('Erro ao criar os usuários:', error);
    } finally {
        await database.close();
        console.log('🔒 Conexão com o banco de dados encerrada.');
    }
}

createUsers();
