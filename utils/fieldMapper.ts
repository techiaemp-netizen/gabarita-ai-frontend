/**
 * FieldMapper - Classe centralizada para mapear campos entre português e inglês
 * 
 * Esta classe fornece mapeamentos bidirecionais entre nomes de campos em português
 * (usados na interface do usuário) e inglês (usados na API/backend).
 */

export interface FieldMapping {
  [key: string]: string;
}

export class FieldMapper {
  // Mapeamento de português para inglês
  private static readonly PT_TO_EN: FieldMapping = {
    // Campos de usuário
    'nome': 'name',
    'nomeCompleto': 'fullName',
    'email': 'email',
    'cpf': 'cpf',
    'cargo': 'position',
    'bloco': 'block',
    'nivel': 'level',
    'experiencia': 'xp',
    'precisao': 'accuracy',
    'plano': 'plan',
    'status': 'status',
    'data_criacao': 'created_at',
    'data_atualizacao': 'updated_at',
    'questoes_respondidas': 'questionsAnswered',
    
    // Campos de questões
    'questao': 'question',
    'assunto': 'subject',
    'topico': 'topic',
    'dificuldade': 'difficulty',
    'opcoes': 'options',
    'resposta_correta': 'correctAnswer',
    'explicacao': 'explanation',
    'fonte': 'source',
    'materia': 'subject',
    
    // Campos de simulado/performance
    'tempo': 'time',
    'tempo_gasto': 'timeSpent',
    'tempo_resposta': 'responseTime',
    'pontuacao': 'score',
    'acertos': 'correctAnswers',
    'erros': 'incorrectAnswers',
    'total_questoes': 'totalQuestions',
    'desempenho': 'performance',
    'progresso': 'progress',
    
    // Campos de ranking
    'ranking': 'ranking',
    'posicao': 'position',
    'usuario_id': 'userId',
    'nome_usuario': 'userName',
    
    // Campos de planos
    'descricao': 'description',
    'preco': 'price',
    'periodo': 'period',
    'duracao': 'duration',
    'recursos': 'features',
    'tipo': 'type',
    'popular': 'popular',
    
    // Campos de notícias
    'titulo': 'title',
    'resumo': 'summary',
    'conteudo': 'content',
    'imagem_url': 'imageUrl',
    'data_publicacao': 'publishedAt',
    'categoria': 'category',
    
    // Campos de pagamento
    'pagamento_id': 'paymentId',
    'status_pagamento': 'paymentStatus',
    'url_pagamento': 'paymentUrl',
    'metodo_pagamento': 'paymentMethod',
    
    // Campos de API/resposta
    'sucesso': 'success',
    'dados': 'data',
    'mensagem': 'message',
    'erro': 'error',
    
    // Campos específicos do sistema
    'todos_cargos': 'allPositions',
    'todos_blocos': 'allBlocks',
    'cargos_blocos': 'positionsBlocks',
    'blocos_cargos': 'blocksPositions',
    'tipo_conhecimento': 'knowledgeType',
    'conhecimentos_gerais': 'generalKnowledge',
    'conhecimentos_especificos': 'specificKnowledge'
  };
  
  // Mapeamento de inglês para português (gerado automaticamente)
  private static readonly EN_TO_PT: FieldMapping = Object.fromEntries(
    Object.entries(FieldMapper.PT_TO_EN).map(([pt, en]) => [en, pt])
  );
  
  /**
   * Converte um campo de português para inglês
   * @param ptField - Nome do campo em português
   * @returns Nome do campo em inglês ou o campo original se não encontrado
   */
  static toEnglish(ptField: string): string {
    return this.PT_TO_EN[ptField] || ptField;
  }
  
  /**
   * Converte um campo de inglês para português
   * @param enField - Nome do campo em inglês
   * @returns Nome do campo em português ou o campo original se não encontrado
   */
  static toPortuguese(enField: string): string {
    return this.EN_TO_PT[enField] || enField;
  }
  
  /**
   * Converte um objeto completo de português para inglês
   * @param ptObject - Objeto com campos em português
   * @returns Objeto com campos convertidos para inglês
   */
  static objectToEnglish<T extends Record<string, any>>(ptObject: T): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(ptObject)) {
      const englishKey = this.toEnglish(key);
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursivamente converter objetos aninhados
        result[englishKey] = this.objectToEnglish(value);
      } else if (Array.isArray(value)) {
        // Para arrays, converter cada item se for objeto
        result[englishKey] = value.map(item => 
          item && typeof item === 'object' ? this.objectToEnglish(item) : item
        );
      } else {
        result[englishKey] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Converte um objeto completo de inglês para português
   * @param enObject - Objeto com campos em inglês
   * @returns Objeto com campos convertidos para português
   */
  static objectToPortuguese<T extends Record<string, any>>(enObject: T): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(enObject)) {
      const portugueseKey = this.toPortuguese(key);
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursivamente converter objetos aninhados
        result[portugueseKey] = this.objectToPortuguese(value);
      } else if (Array.isArray(value)) {
        // Para arrays, converter cada item se for objeto
        result[portugueseKey] = value.map(item => 
          item && typeof item === 'object' ? this.objectToPortuguese(item) : item
        );
      } else {
        result[portugueseKey] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Verifica se um campo existe no mapeamento português -> inglês
   * @param field - Nome do campo
   * @returns true se o campo existe no mapeamento
   */
  static hasPortugueseMapping(field: string): boolean {
    return field in this.PT_TO_EN;
  }
  
  /**
   * Verifica se um campo existe no mapeamento inglês -> português
   * @param field - Nome do campo
   * @returns true se o campo existe no mapeamento
   */
  static hasEnglishMapping(field: string): boolean {
    return field in this.EN_TO_PT;
  }
  
  /**
   * Obtém todos os mapeamentos português -> inglês
   * @returns Objeto com todos os mapeamentos
   */
  static getAllPortugueseMappings(): FieldMapping {
    return { ...this.PT_TO_EN };
  }
  
  /**
   * Obtém todos os mapeamentos inglês -> português
   * @returns Objeto com todos os mapeamentos
   */
  static getAllEnglishMappings(): FieldMapping {
    return { ...this.EN_TO_PT };
  }
  
  /**
   * Adiciona um novo mapeamento dinamicamente
   * @param ptField - Campo em português
   * @param enField - Campo em inglês
   */
  static addMapping(ptField: string, enField: string): void {
    this.PT_TO_EN[ptField] = enField;
    this.EN_TO_PT[enField] = ptField;
  }
  
  /**
   * Remove um mapeamento existente
   * @param ptField - Campo em português a ser removido
   */
  static removeMapping(ptField: string): void {
    const enField = this.PT_TO_EN[ptField];
    if (enField) {
      delete this.PT_TO_EN[ptField];
      delete this.EN_TO_PT[enField];
    }
  }
  
  /**
   * Converte campos de formulário para o formato da API
   * Útil para formulários de cadastro, login, etc.
   * @param formData - Dados do formulário
   * @returns Dados formatados para a API
   */
  static formatForApi(formData: Record<string, any>): Record<string, any> {
    const apiData = this.objectToEnglish(formData);
    
    // Aplicar transformações específicas
    if (apiData.cpf && typeof apiData.cpf === 'string') {
      // Remover formatação do CPF
      apiData.cpf = apiData.cpf.replace(/\D/g, '');
    }
    
    if (apiData.fullName && !apiData.name) {
      // Mapear fullName para name se necessário
      apiData.name = apiData.fullName;
      delete apiData.fullName;
    }
    
    return apiData;
  }
  
  /**
   * Converte dados da API para o formato do frontend
   * @param apiData - Dados recebidos da API
   * @returns Dados formatados para o frontend
   */
  static formatFromApi(apiData: Record<string, any>): Record<string, any> {
    const frontendData = this.objectToPortuguese(apiData);
    
    // Aplicar transformações específicas
    if (frontendData.name && !frontendData.nome) {
      // Mapear name para nome se necessário
      frontendData.nome = frontendData.name;
    }
    
    return frontendData;
  }
}

// Exportar instância padrão para uso direto
export default FieldMapper;

// Exportar funções utilitárias para uso mais simples
export const mapToEnglish = FieldMapper.toEnglish.bind(FieldMapper);
export const mapToPortuguese = FieldMapper.toPortuguese.bind(FieldMapper);
export const mapObjectToEnglish = FieldMapper.objectToEnglish.bind(FieldMapper);
export const mapObjectToPortuguese = FieldMapper.objectToPortuguese.bind(FieldMapper);
export const formatForApi = FieldMapper.formatForApi.bind(FieldMapper);
export const formatFromApi = FieldMapper.formatFromApi.bind(FieldMapper);