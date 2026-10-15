# Gestão de Desempenho - Deploy na Vercel

## ✅ O que foi implementado

### Salvamento Local (localStorage)
- Todas as turmas, atividades e alunos são salvos automaticamente no navegador/dispositivo do professor
- Os dados persistem mesmo após fechar o navegador
- Indicador visual "Salvo localmente" no canto superior direito

### Backup e Restauração
- **Exportar Backup**: Baixa um arquivo JSON com todas as turmas e dados
- **Restaurar Backup**: Importa um arquivo JSON de backup anterior
- Útil para transferir dados entre dispositivos ou fazer backup de segurança

---

## 🚀 Como publicar na Vercel

### Passo 1: Criar conta na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Sign Up"
3. Faça login com GitHub, GitLab ou Email

### Passo 2: Preparar o projeto
Se você ainda não tem o projeto no Git:

```bash
# Inicializar Git (se ainda não fez)
git init
git add .
git commit -m "Initial commit"
```

### Passo 3: Enviar para o GitHub
1. Crie um repositório no GitHub (github.com/new)
2. Conecte e envie o código:

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

### Passo 4: Importar na Vercel
1. Na Vercel, clique em "Add New..." → "Project"
2. Selecione o repositório do GitHub
3. A Vercel detectará automaticamente que é um projeto Vite
4. Clique em "Deploy"

### Passo 5: Acessar seu app
- Após o deploy (cerca de 1-2 minutos), você receberá um link como:
  `https://seu-projeto.vercel.app`
- Seu app está online! 🎉

---

## 📱 Sobre os dados salvos

### Onde ficam salvos?
- Os dados ficam salvos no **localStorage** do navegador/dispositivo
- Cada dispositivo tem seu próprio localStorage
- Se o professor usar o app no celular, os dados ficam salvos no celular
- Se usar no computador, ficam salvos no computador

### Como fazer backup?
1. No app, clique no botão **"Backup"** (ícone de download) no topo
2. Um arquivo JSON será baixado
3. Guarde este arquivo em local seguro (Google Drive, email, etc.)

### Como restaurar dados?
1. Clique no botão **"Restaurar"** (ícone de upload) no topo
2. Selecione o arquivo JSON de backup
3. Confirme a importação

### Limitações do localStorage
- **Espaço**: Cerca de 5-10MB por dispositivo (suficiente para centenas de turmas)
- **Persistência**: Dados permanecem até o usuário limpar o cache do navegador
- **Portabilidade**: Dados não são sincronizados entre dispositivos automaticamente
- **Solução**: Use o sistema de backup para transferir entre dispositivos

---

## 🔧 Configurações do projeto

### Arquivos importantes
- `vercel.json` - Configuração de deploy para Vercel
- `vite.config.js` - Configuração do Vite
- `src/hooks/useLocalStorage.ts` - Hook para salvar dados localmente

### Comandos úteis
```bash
# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## 💡 Dicas de uso

1. **Faça backups regulares**: Clique em "Backup" periodicamente
2. **Use o mesmo dispositivo**: Os dados ficam salvos no dispositivo usado
3. **Múltiplos dispositivos**: Use o backup para sincronizar manualmente
4. **Limpeza do navegador**: Evite limpar cache/dados do navegador para não perder os dados

---

## 🆘 Problemas comuns

### "Meus dados sumiram!"
- Verifique se está usando o mesmo navegador/dispositivo
- Verifique se não limpou o cache do navegador
- Restaure um backup se tiver

### "O app está lento"
- Muitos dados podem deixar o app lento
- Faça backup e remova turmas antigas se necessário

### "Quero sincronizar entre dispositivos"
- Use o sistema de backup manual (exportar/importar)
- Ou considere migrar para um banco de dados online (Firebase, Supabase) no futuro

---

## 📞 Suporte

Se tiver dúvidas sobre o deploy ou o uso do app, consulte a documentação da Vercel:
- [Vercel Docs](https://vercel.com/docs)
- [Vite Docs](https://vitejs.dev)

---

**Desenvolvido com ❤️ para facilitar a gestão de desempenho escolar**
