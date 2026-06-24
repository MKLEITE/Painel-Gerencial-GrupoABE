/**
 * Padrão Conventional Commits.
 * Exemplos:
 *   feat(carteira): adiciona KPI de roll rate
 *   fix(api): corrige filtro de tenant na busca
 *   docs(adr): registra escolha do provedor de identidade
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
  },
};
