# 🚀 Guia Completo: Publicar na Vercel

## ✅ Pré-requisitos

Antes de começar, você precisa ter instalado:
- **Node.js** (versão 18 ou superior) - [Baixar aqui](https://nodejs.org/)
- **Git** - [Baixar aqui](https://git-scm.com/)
- **Conta no GitHub** - [Criar conta](https://github.com/signup)

---

## 📋 Passo a Passo

### **PASSO 1: Preparar o Projeto**

1. **Abra o terminal** (CMD no Windows, Terminal no Mac/Linux)

2. **Navegue até a pasta do projeto**:
   ```bash
   cd caminho/para/seu/projeto
   ```

3. **Teste se o projeto funciona localmente**:
   ```bash
   npm install
   npm run build
   ```
   Se não der erro, está tudo certo! ✅

---

### **PASSO 2: Criar Conta na Vercel**

1. Acesse **[vercel.com](https://vercel.com)**

2. Clique em **"Sign Up"** (canto superior direito)

3. Escolha uma opção para criar conta:
   - **GitHub** (recomendado) ⭐
   - GitLab
   - Bitbucket
   - Email

4. Autorize o acesso da Vercel ao seu GitHub

---

### **PASSO 3: Criar Repositório no GitHub**

1. Acesse **[github.com](https://github.com)** e faça login

2. Clique no botão **"+"** (canto superior direito) → **"New repository"**

3. Preencha:
   - **Repository name**: `gestao-desempenho` (ou o nome que preferir)
   - **Description**: "Sistema de gestão de desempenho escolar"
   - Deixe **Public** ou **Private** (sua escolha)
   - **NÃO** marque "Add a README file" (já temos um)
   - **NÃO** marque "Add .gitignore"
   - **NÃO** marque "Choose a license"

4. Clique em **"Create repository"**

---

### **PASSO 4: Enviar Projeto para o GitHub**

No terminal, dentro da pasta do projeto, execute os comandos **um por um**:

```bash
# 1. Inicializar Git (se ainda não fez)
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Criar primeiro commit
git commit -m "Primeiro commit - Sistema de gestão de desempenho"

# 4. Renomear branch principal para 'main'
git branch -M main

# 5. Conectar com o repositório do GitHub
# IMPORTANTE: Substitua SEU_USUARIO pelo seu nome de usuário do GitHub
git remote add origin https://github.com/SEU_USUARIO/gestao-desempenho.git

# 6. Enviar os arquivos para o GitHub
git push -u origin main
```

**Exemplo real** (se seu usuário é "joao123"):
```bash
git remote add origin https://github.com/joao123/gestao-desempenho.git
```

Quando pedir login:
- **Username**: seu usuário do GitHub
- **Password**: use um **Personal Access Token** (não a senha normal)

**Como criar o Token:**
1. Vá em GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clique em **"Generate new token (classic)"**
3. Marque a opção **"repo"**
4. Gere e copie o token
5. Use esse token como senha no Git

---

### **PASSO 5: Importar Projeto na Vercel**

1. Acesse **[vercel.com](https://vercel.com)** e faça login

2. Clique em **"Add New..."** → **"Project"**

3. Você verá uma lista dos seus repositórios do GitHub

4. Encontre **"gestao-desempenho"** e clique em **"Import"**

5. A Vercel vai detectar automaticamente que é um projeto Vite:
   - **Framework Preset**: Vite ✅
   - **Build Command**: `npm run build` ✅
   - **Output Directory**: `dist` ✅

6. Clique em **"Deploy"** 🚀

7. **Aguarde** cerca de 1-2 minutos...

---

### **PASSO 6: Acessar seu App Online!** 🎉

Pronto! A Vercel vai te dar um link como:

```
https://gestao-desempenho-seu-usuario.vercel.app
```

**Seu app está no ar!** 🎊

---

## 🔄 Como Atualizar o Site

Sempre que você fizer alterações no código:

```bash
# 1. Adicione as mudanças
git add .

# 2. Crie um commit
git commit -m "Descrição do que mudou"

# 3. Envie para o GitHub
git push
```

**A Vercel vai detectar automaticamente e atualizar o site!** ✨

---

## 📱 Sobre os Dados Salvos

### Onde ficam os dados?
- Os dados ficam salvos no **navegador/dispositivo** de quem usa o app
- Cada professor tem seus próprios dados no seu dispositivo
- **NÃO** ficam salvos na Vercel ou em servidor

### Como fazer backup?
1. No app, clique no botão **"Backup"** (↓) no topo
2. Um arquivo JSON será baixado
3. Guarde em local seguro (Google Drive, email, etc.)

### Como restaurar dados?
1. Clique em **"Restaurar"** (↑)
2. Selecione o arquivo JSON de backup
3. Confirme a importação

---

## 🛠️ Comandos Úteis

```bash
# Rodar o projeto localmente (desenvolvimento)
npm run dev

# Criar versão de produção
npm run build

# Verificar se há erros de TypeScript
npm run typecheck

# Ver status do Git
git status

# Ver histórico de commits
git log --oneline
```

---

## ❓ Problemas Comuns

### "O site aparece em branco"
- Abra o console do navegador (F12)
- Verifique se há erros
- Tente limpar o cache do navegador

### "Meus dados sumiram"
- Verifique se está usando o mesmo navegador/dispositivo
- Os dados ficam salvos localmente
- Restaure um backup se tiver

### "Erro ao fazer push"
- Verifique se o token está correto
- Tokens expiram - gere um novo se necessário
- Verifique se o repositório existe no GitHub

### "A Vercel não detecta o projeto"
- Verifique se o repositório tem o arquivo `package.json`
- Confira se o `vercel.json` está na raiz do projeto

---

## 🎯 Próximos Passos

### Adicionar domínio personalizado (opcional)
1. Na Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio (ex: `minhaescola.com.br`)
3. Siga as instruções para configurar o DNS

### Melhorias futuras (opcional)
- Adicionar banco de dados online (Firebase, Supabase) para sincronizar dados
- Implementar login de professores
- Adicionar mais relatórios e gráficos

---

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **GitHub Docs**: https://docs.github.com

---

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] Git instalado
- [ ] Conta no GitHub criada
- [ ] Conta na Vercel criada
- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub
- [ ] Projeto importado na Vercel
- [ ] Site funcionando online
- [ ] Testado o backup/restauração

---

**Parabéns! Seu sistema de gestão de desempenho está online!** 🎉🚀

**Dica importante**: Faça backups regulares dos dados usando o botão "Backup" no app!
