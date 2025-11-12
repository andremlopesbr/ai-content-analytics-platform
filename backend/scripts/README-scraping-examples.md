# Content Scraping Examples

Este script demonstra funcionalidades completas de scraping de conteúdo web, incluindo extração de dados, tratamento de erros e integração com análise de IA.

## Funcionalidades Demonstradas

### ✅ Scraping Real de Websites

- **BBC News**: Extração de artigos de notícias
- **GitHub README**: Documentação técnica
- **Example.com**: Website de demonstração simples

### ✅ Extração de Dados

- **Títulos**: Extração inteligente de títulos de páginas
- **Conteúdo**: Texto principal limpo e estruturado
- **Metadados**: Open Graph, Twitter Cards, metadados padrão
- **Links**: Extração e validação de URLs
- **Estatísticas**: Contagem de palavras, tempo de leitura

### ✅ Tratamento de Erros Robusto

- URLs inválidas
- Domínios inexistentes
- Timeouts de conexão
- Tentativas automáticas com backoff

### ✅ Logging e Monitoramento

- Logs estruturados com timestamps
- Níveis de severidade (INFO, WARN, ERROR, SUCCESS)
- Estatísticas de performance

### ✅ Recursos Avançados

- Rate limiting por domínio
- Pool de conexões configurável
- User agents personalizáveis
- Limpeza automática de HTML

## Como Executar

### Pré-requisitos

- Node.js e npm instalados
- Dependências instaladas: `npm install`

### Execução Básica (Sem Banco)

```bash
cd backend
npx ts-node scripts/scraping-examples.ts
```

Este modo demonstra scraping e extração de dados sem precisar de MongoDB.

### Execução Completa (Com Banco e IA)

1. **Inicie o MongoDB**:

   ```bash
   mongod
   ```

2. **Configure variáveis de ambiente**:

   ```bash
   cp .env.example .env
   # Edite .env e adicione GEMINI_API_KEY
   ```

3. **Execute o script**:

   ```bash
   npx ts-node scripts/scraping-examples.ts
   ```

## Arquitetura

### Componentes Principais

1. **WebScraperService**: Serviço core de scraping usando Puppeteer
2. **ScrapeContentUseCase**: Caso de uso para processamento de conteúdo
3. **AnalyzeContentUseCase**: Integração com análise de IA
4. **ScrapingDemo**: Classe de demonstração com logging

### Fluxo de Execução

1. **Inicialização**: Conecta ao banco (opcional) e configura dependências
2. **Demonstração de Erros**: Testa cenários de falha
3. **Scraping**: Processa URLs reais com extração de dados
4. **Persistência**: Salva conteúdo no MongoDB (se disponível)
5. **Análise**: Enfileira análise de IA (se disponível)
6. **Relatório**: Exibe estatísticas e resultados

## Configurações

### URLs de Teste

Modifique `SCRAPING_EXAMPLES` no código para adicionar novos sites:

```typescript
{
  name: 'Nome do Site',
  url: 'https://exemplo.com',
  category: 'categoria',
  description: 'Descrição do que será extraído'
}
```

### Opções de Scraping

Ajuste timeouts, retry attempts e user agents conforme necessário.

## Resultados Esperados

### Com Banco Disponível

- ✅ Scraping bem-sucedido
- ✅ Conteúdo salvo no MongoDB
- ✅ Análise de IA enfileirada
- ✅ Relatório completo de dados extraídos

### Sem Banco (Modo Demonstrativo)

- ✅ Scraping bem-sucedido
- ✅ Extração de dados funcional
- ⚠️  Funcionalidades de banco desabilitadas
- ⚠️  Análise de IA não disponível

## Tratamento de Erros

O script trata graciosamente:

- Falhas de conexão de banco
- URLs inválidas ou inacessíveis
- Timeouts de scraping
- Erros de análise de IA

## Limitações

- Rate limiting respeitoso (1 req/seg por domínio)
- Sem bypass de proteções anti-bot
- Uso educacional apenas
- Respeito aos termos de serviço dos sites

## Extensões Possíveis

- Adicionar mais seletores CSS para diferentes tipos de conteúdo
- Implementar cache Redis para conteúdo já extraído
- Adicionar análise de sentimento em tempo real
- Suporte a múltiplos formatos de exportação
- Dashboard web para monitoramento visual
