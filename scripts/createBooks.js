require('dotenv').config();
const database = require('../models/connection');
const Book = require('../models/book');

async function addBooks() {
    const books = [
        {
            name: "Tropa de Elite [ELITE DA TROPA]",
            category: "Ação",
            author: "André Batista, Rodrigo Pimentel e Luiz Eduardo Soares",
            image: "elitedatropa.jpg",
            description: "Um retrato brutal e realista da Tropa de Elite do BOPE, abordando o combate ao crime organizado no Rio de Janeiro, a corrupção e os dilemas éticos enfrentados pelos policiais.",
            userId: 3,
        },
        {
            name: "O Poderoso Chefão",
            category: "Ação",
            author: "Mario Puzo",
            image: "opoderosochefao.jpg",
            description: "Um épico da máfia que narra a ascensão da família Corleone, seus códigos de honra, vingança e o jogo de poder nos bastidores do crime organizado nos Estados Unidos.",
            userId: 4,
        },
        {
            name: "A Arte da Guerra",
            category: "Ação",
            author: "Sun Tzu",
            image: "suntzu.jpg",
            description: "Manual estratégico milenar usado por generais, empresários e líderes. Ensina como vencer batalhas sem conflito direto e dominar situações com sabedoria e cálculo.",
            userId: 2,
        },
        {
            name: "Sniper Americano",
            category: "Ação",
            author: "Chris Kyle",
            image: "sniperamericano.jpg",
            description: "Autobiografia do atirador mais letal da história militar dos EUA. Um retrato cru e intenso das guerras no Iraque e Afeganistão, e os dilemas de um guerreiro.",
            userId: 7,
        },
        {
            name: "Inteligência do Carisma",
            category: "Educação",
            author: "Heni Ozi Cukier",
            image: "inteligenciadocarisma.jpg",
            description: "Aprenda a conquistar, cativar e influenciar pessoas com técnicas de persuasão, linguagem corporal e inteligência emocional. Essencial para líderes e comunicadores.",
            userId: 2,
        },
        {
            name: "Matemática para Concursos",
            category: "Educação",
            author: "Lillian Rose Cerchiareto Quilelli Correa",
            image: "matematica.jpg",
            description: "Didático e completo, este livro é ideal para concurseiros que precisam dominar a matemática básica e intermediária, com foco em provas e exercícios comentados.",
            userId: 4,
        },
        {
            name: "Israel x Palestina: 100 Anos de Guerra",
            category: "Educação",
            author: "James L. Gelvin",
            image: "israelxpalestina.jpg",
            description: "Este livro oferece uma análise clara, concisa e imparcial do longo e complexo conflito entre israelenses e palestinos. Com foco histórico e político, James L. Gelvin traça os principais eventos desde o final do Império Otomano até os dias atuais, contextualizando as raízes do embate, os interesses geopolíticos e as tentativas de paz. Uma leitura essencial para quem deseja entender a dinâmica do Oriente Médio e os desdobramentos do conflito mais persistente da atualidade.",
            userId: 3,
        },
        {
            name: "Sapiens: Uma Breve História da Humanidade",
            category: "Educação",
            author: "Yuval Noah Harari",
            image: "sapiens.jpg",
            description: "Uma jornada fascinante pela história do Homo sapiens, analisando como cultura, economia e política moldaram o mundo moderno.",
            userId: 1,
        },
        {
            name: "Como Mentir com Estatística",
            category: "Educação",
            author: "Darrell Huff",
            image: "comomentircomestatistica.jpg",
            description: "Um clássico sobre como estatísticas podem ser manipuladas para enganar. Essencial para quem quer desenvolver pensamento crítico diante de números.",
            userId: 2,
        },
        {
            name: "Guerra Irregular: Terrorismo, Guerrilha e Movimentos de Resistência ao Longo da História",
            category: "Educação",
            author: "Colin S. Gray",
            image: "guirregular.jpg",
            description: "Uma análise precisa e profunda sobre conflitos assimétricos, com foco em táticas e impactos geopolíticos de guerras não convencionais.",
            userId: 6,
        },
        {
            name: "O Príncipe",
            category: "Educação",
            author: "Maquiavel",
            image: "oprincipemaquiavel.jpg",
            description: "Um dos livros políticos mais importantes da história, que analisa o poder, a liderança e a arte de governar de forma realista e estratégica.",
            userId: 6,
        },
        {
            name: "Batman: Ano Um",
            category: "Ficção",
            author: "Frank Miller",
            image: "batmananoum.jpg",
            description: "Considerada uma das histórias definitivas do Cavaleiro das Trevas, 'Ano Um' reconta as origens do Batman em Gotham City. Escrita por Frank Miller, esta graphic novel apresenta um Bruce Wayne mais humano e sombrio, enquanto o comissário Gordon enfrenta a corrupção policial. Uma narrativa intensa e cinematográfica.",
            userId: 6,
        },
        {
            name: "God of war (vol. 1)",
            category: "Ficção",
            author: "Matthew Stover",
            image: "gow.jpg",
            description: "Kratos é um guerreiro grego a serviço dos deuses Gregos do Olimpo. Enganado por Ares, o Deus da Guerra, que queria transformá-lo num guerreiro perfeito, Kratos acidentalmente mata sua esposa e sua filha, mas, depois disso, Kratos decide não servir mais a Ares e é amaldiçoado com as cinzas de sua família morta pelo Oráculo da cidade que foi destruída. Kratos é atormentado com memórias de seus atos e faz um trato de servir aos outros deuses do Olimpo por dez anos. Cansado de servir, convoca Atena e, ela afirma que o perdoará por seus atos se ele realizar uma última tarefa: matar Ares. Para isso ele deve encontrar e usar a Caixa de Pandora.",
            userId: 4,
        },
        {
            name: "Admirável Mundo Novo",
            category: "Ficção",
            author: "Aldous Huxley",
            image: "admiravelmundonovo.jpg",
            description: "Neste clássico distópico, a humanidade vive sob um regime de controle social baseado em prazer, consumo e engenharia genética. A obra antecipa debates sobre liberdade, tecnologia e identidade, com uma crítica afiada à sociedade moderna.",
            userId: 2,
        }
    ];


    try {
        // Testa a conexão
        await database.authenticate();
        console.log('✅ Conexão com o banco de dados estabelecida.');

        // Adiciona os livros
        for (const book of books) {
            await Book.create(book);
            console.log(`📚 Livro "${book.name}" adicionado com sucesso.`);
        }
    } catch (error) {
        console.error('❌ Erro ao adicionar livros:', error);
    } finally {
        await database.close();
        console.log('🔒 Conexão com o banco de dados encerrada.');
    }
}

addBooks();
