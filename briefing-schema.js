export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_FILES_BYTES = 2 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_FILES_BYTES + 256 * 1024;
export const FILE_TYPES = ["png", "jpg", "jpeg", "webp", "pdf", "zip"];
export function fieldError(field, values) {
  if (values.some(value => typeof value !== 'string')) return 'Valor inválido.';
  if (!field.multiple && values.length > 1) return 'Envie apenas uma resposta.';
  if (field.required && !values.some(value => value.trim())) return 'Preencha este campo.';
  if (field.multiple && (values.length > field.options.length || new Set(values).size !== values.length)) return 'Seleção inválida.';
  for (const value of values) {
    const text = value.trim();
    if (text.length > field.max) return `Use até ${field.max} caracteres.`;
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) return 'Remova os caracteres inválidos.';
    if (!text) continue;
    if (field.options && !field.options.includes(text)) return 'Selecione uma das opções disponíveis.';
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Informe um e-mail válido.';
    if (field.type === 'tel' && (!/^[+\d\s().-]+$/.test(text) || !/^\d{10,15}$/.test(text.replace(/\D/g, '')))) return 'Informe o telefone com DDD.';
    if (field.type === 'url') {
      try {
        const url = new URL(text);
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return 'Informe um endereço http:// ou https:// válido.';
      } catch { return 'Informe um endereço http:// ou https:// válido.'; }
    }
    if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text)) return 'Informe uma data válida.';
  }
  return '';
}
export const FIELDS = {
  "empresa": {
    "label": "Nome da empresa",
    "step": 1,
    "required": true,
    "type": "text",
    "max": 200
  },
  "responsavel": {
    "label": "Responsável pelo projeto",
    "step": 1,
    "required": true,
    "type": "text",
    "max": 200
  },
  "email": {
    "label": "E-mail",
    "step": 1,
    "required": true,
    "type": "email",
    "max": 200
  },
  "telefone": {
    "label": "WhatsApp / telefone",
    "step": 1,
    "required": true,
    "type": "tel",
    "max": 200
  },
  "tipo_projeto": {
    "label": "Tipo de projeto",
    "step": 1,
    "required": true,
    "type": "radio",
    "max": 200,
    "options": [
      "Site institucional",
      "Landing page",
      "Sistema web",
      "E-commerce",
      "Automação",
      "Integração de sistemas"
    ]
  },
  "objetivo_principal": {
    "label": "Objetivo principal do projeto",
    "step": 1,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "acao_principal": {
    "label": "Qual ação você quer que o visitante realize?",
    "step": 1,
    "required": true,
    "type": "select-one",
    "max": 200,
    "options": [
      "Entrar em contato",
      "Solicitar orçamento",
      "Comprar",
      "Agendar atendimento",
      "Criar conta / fazer login",
      "Baixar material",
      "Conhecer a empresa",
      "Outra"
    ]
  },
  "problema_atual": {
    "label": "Qual problema motivou este projeto?",
    "step": 1,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "criterio_sucesso": {
    "label": "Como você saberá que o projeto deu certo?",
    "step": 1,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "segmento": {
    "label": "Segmento de atuação",
    "step": 2,
    "required": true,
    "type": "text",
    "max": 200
  },
  "site_atual": {
    "label": "Site atual",
    "step": 2,
    "required": false,
    "type": "url",
    "max": 500
  },
  "descricao_empresa": {
    "label": "O que a empresa faz?",
    "step": 2,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "regiao_atendimento": {
    "label": "Onde a empresa atende?",
    "step": 2,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "publico_alvo": {
    "label": "Quem é o público-alvo?",
    "step": 2,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "diferenciais": {
    "label": "Quais são os principais diferenciais da empresa?",
    "step": 2,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "concorrentes": {
    "label": "Principais concorrentes",
    "step": 2,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "objecoes_clientes": {
    "label": "Quais dúvidas ou objeções seus clientes costumam ter?",
    "step": 2,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "paginas": {
    "label": "Páginas ou áreas previstas",
    "step": 3,
    "required": false,
    "type": "checkbox",
    "max": 200,
    "multiple": true,
    "options": [
      "Home",
      "Sobre",
      "Serviços",
      "Produtos",
      "Portfólio",
      "Blog",
      "FAQ",
      "Contato"
    ]
  },
  "funcionalidades": {
    "label": "Funcionalidades necessárias",
    "step": 3,
    "required": false,
    "type": "checkbox",
    "max": 200,
    "multiple": true,
    "options": [
      "Formulário de contato",
      "Integração com WhatsApp",
      "Área do cliente / Login",
      "Pagamentos online",
      "Agendamento",
      "Relatórios / Dashboard",
      "Upload de arquivos",
      "Busca",
      "Notificações por e-mail",
      "Integração com APIs",
      "Painel administrativo",
      "Chat / atendimento"
    ]
  },
  "fluxo_usuario": {
    "label": "Existe algum fluxo específico que o usuário precisa realizar?",
    "step": 3,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "outras_funcionalidades": {
    "label": "Outras funcionalidades ou regras",
    "step": 3,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "volume_estimado": {
    "label": "Existe uma estimativa de volume de usuários, pedidos ou acessos?",
    "step": 3,
    "required": false,
    "type": "text",
    "max": 200
  },
  "perfis_usuario": {
    "label": "O sistema terá diferentes perfis de acesso?",
    "step": 3,
    "required": false,
    "type": "text",
    "max": 200
  },
  "ativos": {
    "label": "O que sua empresa já possui?",
    "step": 4,
    "required": false,
    "type": "checkbox",
    "max": 200,
    "multiple": true,
    "options": [
      "Logotipo",
      "Manual da marca",
      "Paleta de cores",
      "Fotos profissionais",
      "Vídeos",
      "Textos",
      "Nenhum"
    ]
  },
  "personalidade_marca": {
    "label": "Como a marca deve ser percebida?",
    "step": 4,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "evitar_design": {
    "label": "Existe algo que você não quer no design?",
    "step": 4,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "referencias": {
    "label": "Referências visuais",
    "step": 4,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "conteudo_status": {
    "label": "Como está o conteúdo do projeto?",
    "step": 4,
    "required": false,
    "type": "select-one",
    "max": 200,
    "options": [
      "Já temos todos os textos e imagens",
      "Temos parte do conteúdo",
      "Precisamos revisar o conteúdo existente",
      "Precisamos criar os textos",
      "Ainda não sabemos"
    ]
  },
  "observacoes_design": {
    "label": "Observações sobre design e conteúdo",
    "step": 4,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "dominio": {
    "label": "Possui domínio?",
    "step": 5,
    "required": false,
    "type": "select-one",
    "max": 200,
    "options": [
      "Sim",
      "Não",
      "Não sei"
    ]
  },
  "hospedagem": {
    "label": "Possui hospedagem?",
    "step": 5,
    "required": false,
    "type": "select-one",
    "max": 200,
    "options": [
      "Sim",
      "Não",
      "Não sei"
    ]
  },
  "email_corporativo": {
    "label": "Possui e-mail corporativo?",
    "step": 5,
    "required": false,
    "type": "select-one",
    "max": 200,
    "options": [
      "Sim",
      "Não",
      "Não sei"
    ]
  },
  "integracoes": {
    "label": "Quais sistemas precisam ser integrados?",
    "step": 5,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "automacoes": {
    "label": "Há processos que deveriam ser automatizados?",
    "step": 5,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "medicao_marketing": {
    "label": "Medição e marketing",
    "step": 5,
    "required": false,
    "type": "checkbox",
    "max": 200,
    "multiple": true,
    "options": [
      "Google Analytics",
      "Google Tag Manager",
      "Meta Pixel",
      "SEO"
    ]
  },
  "dados_coletados": {
    "label": "Quais dados pessoais o projeto coletará?",
    "step": 5,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "requisitos_seguranca": {
    "label": "Há requisitos de segurança, LGPD ou compliance?",
    "step": 5,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "manutencao": {
    "label": "Após a entrega, haverá necessidade de manutenção contínua?",
    "step": 5,
    "required": false,
    "type": "select-one",
    "max": 200,
    "options": [
      "Sim, suporte recorrente",
      "Sim, atualizações de conteúdo",
      "Talvez",
      "Não no momento"
    ]
  },
  "infra_existente": {
    "label": "Existe alguma infraestrutura ou tecnologia que precisa ser mantida?",
    "step": 5,
    "required": false,
    "type": "text",
    "max": 200
  },
  "prazo_desejado": {
    "label": "Data desejada para entrega",
    "step": 6,
    "required": false,
    "type": "date",
    "max": 200
  },
  "prioridade": {
    "label": "Nível de prioridade",
    "step": 6,
    "required": true,
    "type": "select-one",
    "max": 200,
    "options": [
      "Sem urgência",
      "Prioridade normal",
      "Alta prioridade",
      "Existe uma data fixa"
    ]
  },
  "orcamento": {
    "label": "Faixa de investimento",
    "step": 6,
    "required": true,
    "type": "select-one",
    "max": 200,
    "options": [
      "Até R$ 2.000",
      "R$ 2.000 a R$ 5.000",
      "R$ 5.000 a R$ 10.000",
      "R$ 10.000 a R$ 20.000",
      "Acima de R$ 20.000",
      "Prefiro receber uma recomendação"
    ]
  },
  "decisores": {
    "label": "Quem participa da decisão e aprovação?",
    "step": 6,
    "required": true,
    "type": "textarea",
    "max": 2400
  },
  "processo_aprovacao": {
    "label": "Como funciona o processo de aprovação?",
    "step": 6,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "requisitos_essenciais": {
    "label": "O que é indispensável no projeto?",
    "step": 6,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "requisitos_opcionais": {
    "label": "O que pode ficar para uma segunda fase?",
    "step": 6,
    "required": false,
    "type": "textarea",
    "max": 2400
  },
  "observacoes_finais": {
    "label": "Observações adicionais",
    "step": 6,
    "required": false,
    "type": "textarea",
    "max": 2400
  }
};
export const GROUPS = [
  {
    "title": "Informações do projeto",
    "names": [
      "empresa",
      "responsavel",
      "email",
      "telefone",
      "tipo_projeto",
      "objetivo_principal",
      "acao_principal",
      "problema_atual",
      "criterio_sucesso"
    ]
  },
  {
    "title": "Sobre sua empresa",
    "names": [
      "segmento",
      "site_atual",
      "descricao_empresa",
      "regiao_atendimento",
      "publico_alvo",
      "diferenciais",
      "concorrentes",
      "objecoes_clientes"
    ]
  },
  {
    "title": "Requisitos e funcionalidades",
    "names": [
      "paginas",
      "funcionalidades",
      "fluxo_usuario",
      "outras_funcionalidades",
      "volume_estimado",
      "perfis_usuario"
    ]
  },
  {
    "title": "Design e conteúdo",
    "names": [
      "ativos",
      "personalidade_marca",
      "evitar_design",
      "referencias",
      "conteudo_status",
      "observacoes_design"
    ]
  },
  {
    "title": "Recursos técnicos",
    "names": [
      "dominio",
      "hospedagem",
      "email_corporativo",
      "integracoes",
      "automacoes",
      "medicao_marketing",
      "dados_coletados",
      "requisitos_seguranca",
      "manutencao",
      "infra_existente"
    ]
  },
  {
    "title": "Prazo e investimento",
    "names": [
      "prazo_desejado",
      "prioridade",
      "orcamento",
      "decisores",
      "processo_aprovacao",
      "requisitos_essenciais",
      "requisitos_opcionais",
      "observacoes_finais"
    ]
  }
];
