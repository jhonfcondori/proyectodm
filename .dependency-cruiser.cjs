/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Circular dependencies make modules hard to reason about.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-pure',
      comment: 'packages/domain must not depend on apps or other workspace packages.',
      severity: 'error',
      from: { path: '^packages/domain/' },
      to: { path: '^(apps/|packages/(shared|vault)/)' },
    },
    {
      name: 'domain-no-node-core',
      comment: 'packages/domain must not perform I/O or use Node built-ins.',
      severity: 'error',
      from: { path: '^packages/domain/' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'shared-no-apps',
      comment: 'packages/shared must stay independent from applications.',
      severity: 'error',
      from: { path: '^packages/shared/' },
      to: { path: '^apps/' },
    },
    {
      name: 'vault-no-apps',
      comment: 'packages/vault is an adapter library and must not import applications.',
      severity: 'error',
      from: { path: '^packages/vault/' },
      to: { path: '^apps/' },
    },
    {
      name: 'web-no-server-code',
      comment: 'The web app must not import the API or the Node-only vault adapter.',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^(apps/api/|packages/vault/)' },
    },
    {
      name: 'api-no-web',
      comment: 'The API must not import browser code from the web app.',
      severity: 'error',
      from: { path: '^apps/api/' },
      to: { path: '^apps/web/' },
    },
    // Cross-module imports must go through the target module's index.ts.
    // dependency-cruiser evaluates `from.path` and `to.path` as independent
    // regexes, so capture backreferences ($1/$2) can never express
    // "same module allowed, other modules index-only": the old rule never matched.
    // We therefore use one `to`-target rule per module (only `health` exists
    // today): any file outside the target module that depends on a non-index
    // file inside it is an error, while imports inside the same module
    // (e.g. `./health.service`) are excluded via `pathNot` on `from`.
    // Each future module adds exactly one rule per app where it exists,
    // covering every cross-module pair into that module.
    // Rejected alternatives: (b) workspace aliases would require tsconfig /
    // Vite / tsup / Vitest resolver changes just to spell cross-module imports;
    // (c) ESLint `no-restricted-imports` matches raw strings, so it must
    // enumerate equivalent spellings (`../m/x`, `../../modules/m/x`, ...) in
    // fragile globs, whereas these rules match canonical resolved paths.
    {
      name: 'no-cross-module-deep-import-api-health',
      comment: 'API cross-module imports must go through the target module index.ts.',
      severity: 'error',
      from: { path: '^apps/api/src/', pathNot: '^apps/api/src/modules/health/' },
      to: { path: '^apps/api/src/modules/health/(?!index\\.ts$).+' },
    },
    {
      name: 'no-cross-module-deep-import-web-health',
      comment: 'Web cross-module imports must go through the target module index.ts.',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/modules/health/' },
      to: { path: '^apps/web/src/modules/health/(?!index\\.ts$).+' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: 'node_modules|dist|coverage|apps/api/src/generated' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
