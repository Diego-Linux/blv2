# Testes de Usuário - Projeto

Este repositório contém os testes de funcionalidades relacionadas ao registro, login, edição de perfil, e outras interações do usuário com a aplicação.

## Resultados dos Testes

### GET /landing
- ✅ **deve renderizar a tela de landing corretamente** (3 ms)

### POST /register
- ✅ **deve retornar erro de validação**: `{ name: '', email: '', password: '', passwordConfirm: '' }` (1 ms)
- ✅ **deve retornar erro de validação**: `{ name: 'Test User', email: 'test@user.com', password: '123', passwordConfirm: '123' }` (1 ms)
- ✅ **deve retornar erro de validação**: `{ name: 'Test User', email: 'test@user.com', password: '123456', passwordConfirm: '654321' }` (1 ms)
- ✅ **deve retornar erro se o e-mail já estiver em uso** (1 ms)
- ✅ **deve criar o usuário com sucesso**

### POST /login
- ✅ **deve redirecionar para /books e configurar sessão para admin** (1 ms)
- ✅ **deve retornar erro caso ocorra um erro desconhecido** (1 ms)

### registerScreen
- ✅ **deve renderizar a página de registro com os dados corretos** (1 ms)
- ✅ **deve renderizar a página de registro sem erros** (1 ms)

### loginScreen
- ✅ **deve renderizar a página de login com os dados corretos**
- ✅ **deve renderizar a página de login sem erros**

### getEditUser
- ✅ **deve renderizar a página de edição de perfil com os dados corretos e mensagens de flash**
- ✅ **deve redirecionar para /profile caso o usuário não seja encontrado e passar mensagem de erro no flash**
- ✅ **deve redirecionar para /profile caso ocorra um erro ao carregar o perfil e passar mensagem de erro no flash**

### POST /update-profile
- ✅ **deve retornar erro se o usuário não for encontrado** (1 ms)
- ✅ **deve retornar erro se não houver alterações no perfil** (1 ms)
- ✅ **deve retornar erro ao salvar as alterações do perfil** (1 ms)
- ✅ **deve atualizar o perfil com sucesso** (2 ms)
- ✅ **deve atualizar a imagem do perfil com sucesso** (1 ms)

### getSolicitationPage Controller
- ✅ **deve renderizar a página de solicitação com os livros do usuário e o livro de troca** (36 ms)
- ✅ **deve retornar erro 500 se ocorrer um erro no controlador** (10 ms)

### POST /logout
- ✅ **deve destruir a sessão e redirecionar para a página de login**

### getBooksUser
- ✅ **deve renderizar a página de livros do usuário com os dados corretos** (1 ms)
- ✅ **deve aplicar paginação corretamente** (1 ms)
- ✅ **deve retornar erro em caso de falha ao buscar livros** (7 ms)

### loadNotifications
- ✅ **deve carregar as notificações do usuário corretamente** (8 ms)
- ✅ **deve contar corretamente as notificações não lidas** (5 ms)
- ✅ **deve continuar o fluxo mesmo quando ocorrer erro** (7 ms)

### markAsRead
- ✅ **deve marcar a notificação como lida e redirecionar para a lista de solicitações** (1 ms)
- ✅ **deve retornar erro caso ocorra uma falha ao marcar a notificação como lida** (7 ms)

---

## Sumário dos Testes

- **Testes de Funcionalidade:** 31 testados, todos **passaram**
- **Snapshots:** 0 total
- **Tempo Total de Execução:** 2.221 s

Test Suites: 1 passed, 1 total  
Tests: 31 passed, 31 total
