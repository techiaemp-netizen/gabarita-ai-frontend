# Mapeamento de Contratos do Frontend (services/api.ts)

Este documento mapeia todos os contratos de API utilizados no frontend do Gabarita AI, mostrando quais endpoints existem no backend e quais precisam ser implementados.

## Status dos Contratos

| Função Frontend | Endpoint Backend | Método | Parâmetros | Resposta | Status |
|----------------|------------------|--------|------------|----------|--------|
| `login(email, password)` | `/api/auth/login` | POST | `{ email: string, password: string }` | `{ success: boolean, token?: string, user?: User }` | ✅ Existe no backend |
| `signup(userData)` | `/api/auth/signup` | POST | `{ email: string, password: string, name: string }` | `{ success: boolean, message: string }` | ✅ Existe no backend |
| `logout()` | `/api/auth/logout` | POST | `{}` | `{ success: boolean }` | ✅ Existe no backend |
| `getUser(userId)` | `/api/user/{id}` | GET | `userId: string` | `{ success: boolean, data: User }` | ✅ Existe no backend |
| `updateUser(userId, data)` | `/api/user/{id}` | PUT | `{ name?: string, email?: string, ... }` | `{ success: boolean, data: User }` | ✅ Existe no backend |
| `getPlans()` | `/api/planos` | GET | `{}` | `{ success: boolean, data: Plan[] }` | ✅ Existe no backend |
| `subscribePlan(planId, userId)` | `/api/planos/subscribe` | POST | `{ planId: string, userId: string }` | `{ success: boolean, data: Subscription }` | ✅ Existe no backend |
| `generateQuestions(params)` | `/api/questoes/gerar` | POST | `{ subject?: string, difficulty?: string, count?: number, bloco?: string, cargo?: string, usuario_id: string }` | `{ success: boolean, data: Question[] }` | ✅ Existe no backend |
| `getQuestions(filters)` | `/api/questoes` | GET | `{ subject?: string, difficulty?: string, ... }` | `{ success: boolean, data: Question[] }` | ✅ Existe no backend |
| `submitAnswer(questionId, answer)` | `/api/questoes/responder` | POST | `{ questionId: string, answer: string, userId: string }` | `{ success: boolean, correct: boolean, explanation?: string }` | ✅ Existe no backend |
| `getOptions(type)` | `/api/opcoes/{type}` | GET | `type: string` | `{ success: boolean, data: Option[] }` | ✅ Existe no backend |
| `processPayment(paymentData)` | `/api/payments/process` | POST | `{ amount: number, method: string, userId: string }` | `{ success: boolean, transactionId?: string }` | ✅ Existe no backend |

## Legenda

- ✅ **Existe no backend**: Endpoint implementado e funcional
- ⚠️ **Parcialmente implementado**: Endpoint existe mas pode ter limitações
- ❌ **Não implementado**: Endpoint não existe no backend
- 🔄 **Em desenvolvimento**: Endpoint sendo desenvolvido

## Observações

1. Todos os endpoints principais estão implementados no backend
2. As rotas seguem o padrão RESTful
3. Autenticação é necessária para a maioria dos endpoints
4. Respostas seguem o padrão `{ success: boolean, data?: any, message?: string }`

## Próximos Passos

- Implementar testes automatizados para todos os contratos
- Adicionar documentação Swagger/OpenAPI
- Implementar rate limiting nos endpoints críticos
- Adicionar logs detalhados para monitoramento