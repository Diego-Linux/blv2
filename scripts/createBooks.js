require('dotenv').config();
const database = require('../models/connection');
const Book = require('../models/book');

async function addBooks() {
    const books = [
        {
            name: "Inteligência do Carisma",
            category: "Educação",
            author: "Heni Ozi Cukier",
            image: 'inteligenciadocarisma.jpg',
            description: "Aprenda a conquistar, cativar, motivar e ser querido e respeitado Você sabia que o carisma não é um dom ou um favor divino, como acreditavam os gregos? Apesar de ter sido usado para descrever os “dons carismáticos” do Espírito Santo, a ciência contemporânea prova que este poder de atrair e influenciar é, na verdade, aprendido e pode ser desenvolvido por qualquer pessoa. Neste livro, o cientista político Heni Ozi Cukier faz um retrato fascinante sobre a história do carisma: desde os nossos antepassados que seguiam o líder nas caçadas (e nem sempre o líder era o mais forte fisicamente), passando pela Grécia Antiga, o Império Romano, as cartas de São Paulo durante a expansão da Igreja Católica, o Renascimento até os dias de hoje. Ao se voltar para a evolução do mundo, Cukier mostra como ter carisma é fundamental nas relações de poder, mas também é instrumento facilitador para o sucesso na vida pessoal e profissional. A partir do desenvolvimento da inteligência emocional, social e contextual, qualquer pessoa pode se tornar carismática. Tudo depende de treinar habilidades e competências, segundo ensina o autor. No nível pessoal, por exemplo, significa conhecer a si mesmo, saber gerir emoções e instintos e definir propósitos de vida. Já no nível social, é preciso treinar ferramentas de comunicação e dominar técnicas de influência e persuasão. E, no nível contextual, ter foco, visão estratégica e curiosidade para se adaptar aos diferentes meios, culturas e padrões de comportamento. O desenvolvimento e o treino dessas inteligências vão proporcionar brilho, presença e visão – o que toda pessoa com poder de carisma tem.",
            userId: 2
        },
        {
            name: "Hábitos Atômicos",
            category: "Educação",
            author: "James Clear",
            image: 'habitosatomicos.jpg',
            description: "Não importa quais sejam seus objetivos, Hábitos Atômicos oferece um método eficaz... [descrição completa]",
            userId: 3
        },
        {
            name: "Matemática para Concursos",
            category: "Educação",
            author: "Lillian Rose Cerchiareto Quilelli Correa",
            image: "matematica.jpg",
            description: "Este livro é ideal para concurseiros que têm dificuldade de estudar e memorizar uma série de regras matemáticas, mas que precisam estar verdadeiramente preparados para o enfrentamento das provas de concurso. Alia a melhor abordagem da teoria exigida pelas bancas com exercícios e questões de prova para praticar e fixar os conteúdos estudados. Contém: exercícios de aplicação: para a prática imediata dos assuntos abordados, assegurando rápida assimilação destes; exercícios resolvidos: questões de concurso para ajudar a entender como resolvê-las sem complicações e a identificar as características das provas; exercícios propostos: questões de prova, mas com gabarito, para treinar ainda mais; notas: curiosidades matemáticas e destaques a pontos importantes que chamam a atenção e facilitam o entendimento. Em linguagem esclarecedora e didática, o autor apresenta diversos macetes que ajudam a aprender Matemática, garantindo aos leitores a melhor preparação.",
            userId: 4
        },
        {
            name: "Pequeno Príncipe",
            category: "Ficção",
            author: "Antoine de Saint-Exupéry",
            image: "pequenoprincipe.jpg",
            description:"Nesta história que marcou gerações de leitores em todo o mundo, um piloto cai com seu avião no deserto do Saara e encontra um pequeno príncipe, que o leva a uma aventura filosófica e poética através de planetas que encerram a solidão humana.",
            userId: 5
        },
        {
            name: "Batman",
            category: "Ficção",
            author: "Rafael Grampá",
            image: "batman.jpg",
            description: "Um assassino em série está à solta, e, embora as vítimas de assassinato pareçam aleatórias no início, cada pista aproxima o Batman da terrível verdade: que todos estão conectados, não apenas uns aos outros… mas a ele também. Em uma Gotham City onde cada dia parece mais sombrio e irremediável do que o anterior, Batman faz uma escolha definitiva: matar a identidade de Bruce Wayne para sempre e abraçar o capuz em tempo integral. Mas, embora conheça as ruas de Gotham, ele logo descobrirá que mal conhece a si mesmo.",
            userId: 6
        },
        {
            name: "Política Brasileira",
            category: "Política",
            author: "Alessandro Nicoli de Mattos",
            image: "politicabrasileira.jpg",
            description: "O Livro Urgente da Política Brasileira é um guia para o cidadão entender a política, o governo e o Estado no Brasil. Numa revisão bibliográfica inédita, o livro aborda questões práticas e temas correntes do discurso político atual, mas sem entrar em aspectos filosóficos ou assuntos polêmicos. O objetivo deste livro é fornecer ao leitor de forma clara e objetiva as informações básicas necessárias para a formação de um \"alfabetismo político\", uma base sobre a qual todos nós poderemos construir nossa consciência política, que é fundamental para que a sociedade engaje em discussões sérias e produtivas que irão, ultimamente, viabilizar um país mais próspero e justo para as gerações futuras.",
            userId: 7
        },
    ];

    try {
        // Testa a conexão
        await database.authenticate();
        console.log('Conexão com o banco de dados estabelecida.');
        // Adiciona os livros
        for (const book of books) {
            await Book.create(book);
            console.log(`Livro "${book.name}" adicionado com sucesso.`);
        }
    } catch (error) {
        console.error('Erro ao adicionar livros:', error);
    } finally {
        // Encerra a conexão com o banco de dados
        await database.close();
        console.log('Conexão com o banco de dados encerrada.');
    }
}

addBooks();
