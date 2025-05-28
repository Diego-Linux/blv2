require('dotenv').config();
const path = require('path');
const cloudinary = require('cloudinary').v2;
const database = require('../models/connection');
const Title = require('../models/title');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

async function uploadToCloudinary(localFilePath) {
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'uploads',
        });
        return result.secure_url;
    } catch (err) {
        console.error('Erro ao fazer upload para o Cloudinary:', err.message);
        return null;
    }
}

async function addTitles() {
    const titles = [
        {
            name: "Tropa de Elite [ELITE DA TROPA]",
            author: "André Batista, Rodrigo Pimentel e Luiz Eduardo Soares",
            image: "elitedatropa.jpg",
            description: "Um retrato brutal e realista da Tropa de Elite do BOPE, abordando o combate ao crime organizado no Rio de Janeiro, a corrupção e os dilemas éticos enfrentados pelos policiais."
        },
        {
            name: "O Poderoso Chefão",
            author: "Mario Puzo",
            image: "opoderosochefao.jpg",
            description: "Um épico da máfia que narra a ascensão da família Corleone, seus códigos de honra, vingança e o jogo de poder nos bastidores do crime organizado nos Estados Unidos."
        },
        {
            name: "A Arte da Guerra",
            author: "Sun Tzu",
            image: "suntzu.jpg",
            description: "Manual estratégico milenar usado por generais, empresários e líderes. Ensina como vencer batalhas sem conflito direto e dominar situações com sabedoria e cálculo."
        },
        {
            name: "Sniper Americano",
            author: "Chris Kyle",
            image: "sniperamericano.jpg",
            description: "Autobiografia do atirador mais letal da história militar dos EUA. Um retrato cru e intenso das guerras no Iraque e Afeganistão, e os dilemas de um guerreiro."
        },
        {
            name: "Inteligência do Carisma",
            author: "Heni Ozi Cukier",
            image: "inteligenciadocarisma.jpg",
            description: "Aprenda a conquistar, cativar e influenciar pessoas com técnicas de persuasão, linguagem corporal e inteligência emocional. Essencial para líderes e comunicadores."
        },
        {
            name: "Matemática para Concursos",
            author: "Lillian Rose Cerchiareto Quilelli Correa",
            image: "matematica.jpg",
            description: "Didático e completo, este livro é ideal para concurseiros que precisam dominar a matemática básica e intermediária, com foco em provas e exercícios comentados."
        },
        {
            name: "Israel x Palestina: 100 Anos de Guerra",
            author: "James L. Gelvin",
            image: "israelxpalestina.jpg",
            description: "Este livro oferece uma análise clara, concisa e imparcial do longo e complexo conflito entre israelenses e palestinos..."
        },
        {
            name: "Sapiens: Uma Breve História da Humanidade",
            author: "Yuval Noah Harari",
            image: "sapiens.jpg",
            description: "Uma jornada fascinante pela história do Homo sapiens, analisando como cultura, economia e política moldaram o mundo moderno."
        },
        {
            name: "Como Mentir com Estatística",
            author: "Darrell Huff",
            image: "comomentircomestatistica.jpg",
            description: "Um clássico sobre como estatísticas podem ser manipuladas para enganar. Essencial para quem quer desenvolver pensamento crítico diante de números."
        },
        {
            name: "Guerra Irregular: Terrorismo, Guerrilha e Movimentos de Resistência ao Longo da História",
            author: "Colin S. Gray",
            image: "guirregular.jpg",
            description: "Uma análise precisa e profunda sobre conflitos assimétricos, com foco em táticas e impactos geopolíticos de guerras não convencionais."
        },
        {
            name: "O Príncipe",
            author: "Maquiavel",
            image: "oprincipemaquiavel.jpg",
            description: "Um dos livros políticos mais importantes da história, que analisa o poder, a liderança e a arte de governar de forma realista e estratégica."
        },
        {
            name: "Batman: Ano Um",
            author: "Frank Miller",
            image: "batmananoum.jpg",
            description: "Considerada uma das histórias definitivas do Cavaleiro das Trevas..."
        },
        {
            name: "God of war (vol. 1)",
            author: "Matthew Stover",
            image: "gow.jpg",
            description: "Kratos é um guerreiro grego a serviço dos deuses Gregos do Olimpo..."
        },
        {
            name: "Admirável Mundo Novo",
            author: "Aldous Huxley",
            image: "admiravelmundonovo.jpg",
            description: "Neste clássico distópico, a humanidade vive sob um regime de controle social baseado em prazer, consumo e engenharia genética..."
        }
    ];

    try {
        await database.authenticate();
        console.log('✅ Conexão com o banco de dados estabelecida.');

        for (const title of titles) {
            const imagePath = path.join(__dirname, '../images/', title.image);
            const imageUrl = await uploadToCloudinary(imagePath);

            if (!imageUrl) {
                console.log(`❌ Falha ao enviar imagem de "${title.name}". Pulando...`);
                continue;
            }

            await Title.create({
                ...title,
                image: imageUrl
            });

            console.log(`📖 Título "${title.name}" adicionado com imagem.`);
        }
    } catch (error) {
        console.error('❌ Erro ao adicionar títulos:', error);
    } finally {
        await database.close();
        console.log('🔒 Conexão com o banco de dados encerrada.');
    }
}

addTitles();
