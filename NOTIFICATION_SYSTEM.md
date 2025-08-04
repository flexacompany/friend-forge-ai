# Sistema de Notificações - Friend Forge AI

## Visão Geral

O sistema de notificações foi implementado para reengajar usuários que ficaram inativos por mais de 24 horas. Quando um usuário não envia mensagens por 24 horas, um dos seus avatares enviará automaticamente uma mensagem para iniciar uma nova conversa.

## Arquitetura do Sistema

### 1. Banco de Dados

#### Tabelas Criadas:

- **`conversation_activity`**: Rastreia a última atividade de cada conversa
  - `user_id`: ID do usuário
  - `avatar_id`: ID do avatar
  - `last_message_at`: Timestamp da última mensagem
  - `notification_sent`: Flag indicando se notificação foi enviada

- **`reengagement_messages`**: Armazena templates de mensagens de reengajamento
  - `id`: ID único
  - `message`: Conteúdo da mensagem
  - `personality`: Tipo de personalidade (friendly, professional, casual, etc.)
  - `tone`: Tom da mensagem (encouraging, curious, supportive, etc.)
  - `category`: Categoria da mensagem (general, check_in, motivation, etc.)

#### Funções RPC:

- **`get_inactive_conversations()`**: Busca conversas inativas há mais de 24 horas
- **`mark_notification_sent(user_id, avatar_id)`**: Marca notificação como enviada

### 2. Edge Function

**Arquivo**: `supabase/functions/notification-system/index.ts`

**Funcionalidade**:
- Verifica conversas inativas (>24h)
- Seleciona templates de mensagens apropriados
- Insere mensagens automáticas na tabela `mensagens`
- Marca notificações como enviadas

### 3. Frontend

#### Hook: `useNotifications`

**Arquivo**: `src/hooks/use-notifications.ts`

**Funcionalidades**:
- Verifica novas mensagens a cada 5 minutos
- Exibe toasts para novas mensagens de avatares
- Gerencia estado das notificações
- Listener em tempo real para novas mensagens
- Função para acionar verificação manual

#### Componente: `NotificationCenter`

**Arquivo**: `src/components/ui/notification-center.tsx`

**Funcionalidades**:
- Interface para visualizar notificações
- Marcar notificações como lidas
- Limpar todas as notificações
- Acionar verificação manual de novas notificações

### 4. Integração no Chat

**Arquivo**: `src/pages/Chat.tsx`

**Adições**:
- Botão de notificações no cabeçalho
- Badge com contador de notificações não lidas
- Modal do centro de notificações

## Como Usar

### 1. Configuração Inicial

1. Execute a migração SQL no Supabase:
   ```sql
   -- Execute o conteúdo do arquivo: supabase/migrations/20250105000000_create_notification_system.sql
   ```

2. Deploy da Edge Function:
   ```bash
   supabase functions deploy notification-system
   ```

### 2. Funcionamento Automático

- O sistema verifica automaticamente conversas inativas
- Após 24h de inatividade, um avatar enviará uma mensagem
- O usuário receberá uma notificação em tempo real
- As notificações aparecem no botão "Notificações" no chat

### 3. Verificação Manual

- Clique no botão "Notificações" no chat
- Use o botão "Verificar Novas" para forçar uma verificação
- Marque notificações como lidas ou limpe todas

## Templates de Mensagens

O sistema inclui 15 templates categorizados:

### Categorias:
- **general**: Mensagens gerais de reengajamento
- **check_in**: Verificação de bem-estar
- **motivation**: Mensagens motivacionais
- **curiosity**: Perguntas curiosas
- **support**: Oferecimento de suporte

### Personalidades:
- **friendly**: Amigável e caloroso
- **professional**: Profissional e respeitoso
- **casual**: Descontraído e informal
- **empathetic**: Empático e compreensivo
- **enthusiastic**: Entusiasmado e energético

### Tons:
- **encouraging**: Encorajador
- **curious**: Curioso
- **supportive**: Apoiador
- **warm**: Caloroso
- **gentle**: Gentil

## Monitoramento

### Logs da Edge Function
- Acesse os logs no dashboard do Supabase
- Monitore execuções da função `notification-system`

### Verificação de Atividade
```sql
-- Verificar conversas inativas
SELECT * FROM get_inactive_conversations();

-- Verificar atividade recente
SELECT * FROM conversation_activity 
WHERE last_message_at > NOW() - INTERVAL '24 hours';
```

## Personalização

### Adicionar Novos Templates
```sql
INSERT INTO reengagement_messages (message, personality, tone, category)
VALUES (
  'Sua nova mensagem aqui',
  'friendly',
  'encouraging', 
  'general'
);
```

### Ajustar Intervalo de Verificação
- Modifique o intervalo no hook `useNotifications` (linha com `setInterval`)
- Padrão: 5 minutos (300000ms)

### Customizar Critério de Inatividade
- Modifique a função `get_inactive_conversations()` no SQL
- Padrão: 24 horas (`NOW() - INTERVAL '24 hours'`)

## Troubleshooting

### Notificações não aparecem:
1. Verifique se a Edge Function está deployada
2. Confirme se as tabelas foram criadas
3. Verifique os logs da função no Supabase

### Mensagens não são enviadas:
1. Verifique se há templates na tabela `reengagement_messages`
2. Confirme se há conversas inativas na tabela `conversation_activity`
3. Verifique as políticas RLS das tabelas

### Erro de permissões:
1. Confirme se as políticas RLS estão configuradas corretamente
2. Verifique se o usuário está autenticado
3. Confirme se as funções RPC têm as permissões adequadas

## Próximos Passos

1. **Agendamento Automático**: Implementar cron job para execução automática da Edge Function
2. **Personalização por Avatar**: Permitir templates específicos por tipo de avatar
3. **Análise de Engajamento**: Métricas de efetividade das mensagens de reengajamento
4. **Configurações do Usuário**: Permitir que usuários configurem frequência e tipos de notificações