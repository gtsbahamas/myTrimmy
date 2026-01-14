# Recommended Claude Code Skills for myTrimmy-prep

> Generated: 2026-01-14
>
> After scaffolding, enhance your project with these Claude Code skills.
> Copy the prompts below directly into Claude Code.
>
> **Enhanced with patterns from [wshobson/agents](https://github.com/wshobson/agents)**

---

## Quick Start

Run these skills in order for best results:

```bash
# 1. Architecture Review (new!)
# Review against Clean Architecture principles
/architecture-patterns

# 2. Database Review (new!)
# PostgreSQL best practices check
/postgresql-design

# 3. API Design Review (new!)
# REST best practices check
/api-design

# 4. Branding
/logo-generator

# 5. UI Enhancement
/frontend-design:frontend-design

# 6. Quality Assurance
/code-review
```

---

## Phase 0: Planning

### `/planning`
> Capture requirements and design before coding

**Prompt:**
```
Review the architecture in CLAUDE_INSTRUCTIONS.md and suggest improvements for myTrimmy-prep
```

### `/architecture-patterns`
> Review architecture against Clean Architecture, Hexagonal, and DDD patterns

**Prompt:**
```
Review myTrimmy-prep architecture against Clean Architecture principles: (1) Dependencies point inward, (2) Business logic independent of frameworks, (3) Testable without UI/database. Check for proper separation of domain/use-cases/adapters/infrastructure.
```

---

## Phase 1: Types

### `/type-first-design`
> Design types and contracts before implementation

**Prompt:**
```
Audit types in src/types/ - ensure invalid states are unrepresentable for entities: 
```

---

## Phase 2: Database

### `/postgresql-design`
> Review PostgreSQL schema for best practices and performance

**Prompt:**
```
Review database schema in supabase/migrations/ for myTrimmy-prep. Check: (1) Use BIGINT GENERATED AS IDENTITY for IDs, not SERIAL, (2) TEXT not VARCHAR, (3) TIMESTAMPTZ not TIMESTAMP, (4) NUMERIC for money, (5) All FK columns have indexes, (6) Partial indexes for hot subsets, (7) GIN indexes for JSONB/arrays. Reference: https://github.com/wshobson/agents/tree/main/plugins/database-design
```

### `/security-integration`
> Enforce security-first development practices

**Prompt:**
```
Review RLS policies in supabase/migrations/ for entities: . Check for proper row-level security.
```

---

## Phase 3: Library

### `/mcp-builder`
> Create MCP servers for external service integration

**Prompt:**
```
Evaluate if myTrimmy-prep needs MCP server integration for any external APIs or services.
```

---

## Phase 4: API

### `/api-design`
> Review API design against REST/GraphQL best practices

**Prompt:**
```
Review API routes in src/app/api/ for myTrimmy-prep. Check: (1) Resources are nouns, not verbs, (2) Correct HTTP status codes (201 for POST, 204 for DELETE), (3) Pagination on all collections (limit 20-100), (4) Consistent error response format, (5) Proper validation before database calls. Reference: https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/api-design-principles
```

---

## Phase 5: UI

### `/logo-generator`
> Generate logo and branding assets

**Prompt:**
```
Generate a logo for &#x27;myTrimmy-prep&#x27;. The app handles: . Create favicon, app icons, and social preview images. Save to public/ directory. Extract brand colors for frontend-design to use.
```

### `/frontend-design:frontend-design`
> Create distinctive, production-grade UI components

**Prompt:**
```
Enhance UI components in src/components/ and pages in src/app/ for myTrimmy-prep. Apply distinctive design: unique typography, bold color choices, purposeful animations, spatial composition. Avoid generic AI aesthetics. Make it memorable.
```

### `/ui-best-practices`
> Build accessible, WCAG-compliant components

**Prompt:**
```
Audit src/components/ for accessibility (WCAG 2.1 AA) - check forms, buttons, and navigation for myTrimmy-prep. Fix any issues before journey verification.
```

### `/user-journey-audit`
> Verify all user flows work end-to-end before UX evaluation

**Prompt:**
```
Audit user journeys for myTrimmy-prep. For each role, verify: (1) All routes exist and are reachable, (2) Forms submit and save data, (3) Navigation links work, (4) Auth flows complete (signup → verify → login → dashboard), (5) CRUD operations succeed for entities: . Use backward-chaining: start from success state, trace dependencies back to origin.
```

### `/ux-audit`
> Evaluate UX quality and identify friction points (runs AFTER journey verification)

**Prompt:**
```
Analyze verified user flows in myTrimmy-prep. Apply Nielsen&#x27;s 10 heuristics. Map journeys for , identify friction points, measure cognitive load, and produce actionable recommendations ranked by impact.
```

---

## Phase 6: Testing

### `/webapp-testing`
> Set up Playwright E2E tests

**Prompt:**
```
Create E2E tests for myTrimmy-prep covering CRUD operations for: 
```

### `/no-mocks-policy`
> Enforce production-first testing philosophy

**Prompt:**
```
Review tests in tests/ - flag any mocks or stubs. Ensure real database and API connections for myTrimmy-prep.
```

---

## Phase 7: Deployment

### `/supabase-deploy`
> Deploy database schema to Supabase using MCP tools

**Prompt:**
```
Deploy myTrimmy-prep to Supabase. Read .deploy-config.json for org ID and region. Use MCP tools: (1) get_cost, (2) confirm_cost, (3) create_project, (4) wait for ACTIVE_HEALTHY status, (5) apply all migrations from supabase/migrations/ in order, (6) get_project_url and get_publishable_keys, (7) create .env.local, (8) run get_advisors for security check. Update manifest with results.
```

### `/vercel-deploy`
> Deploy frontend to Vercel production

**Prompt:**
```
Deploy myTrimmy-prep to Vercel. (1) Run &#x27;npm run build&#x27; to verify, (2) Link project with &#x27;npx vercel link --yes&#x27;, (3) Set env vars from .env.local, (4) Deploy with &#x27;npx vercel --prod --yes&#x27;, (5) Run health checks on production URL, (6) Update .deploy-config.json with production URL and status.
```

---


## Final Quality Checks

These skills run after all scaffolding is complete:

### `/code-review`
> Catch bugs, security issues, and design problems

**Prompt:**
```
Review generated code for myTrimmy-prep: check for bugs, security vulnerabilities, and design problems across all files.
```

### `/code-review:code-review`
> Pull request style code review

**Prompt:**
```
Perform a thorough code review of myTrimmy-prep as if reviewing a PR. Focus on correctness, security, and maintainability.
```

### `/production-ready-audit`
> Comprehensive production readiness audit - orchestrates all specialized audits

**Prompt:**
```
Run production-ready-audit on myTrimmy-prep. Audit the generated codebase for production readiness. This orchestrates: security-audit, accessibility-audit, performance-audit, error-handling-audit, edge-case-audit, api-contract-audit, ux-audit, user-journey-audit, and click-audit. All audits must pass before the code is considered deployment-ready. Report any failures with specific file locations and remediation steps.
```

### `/full-deploy`
> Complete deployment to Supabase + Vercel with health checks

**Prompt:**
```
Run full deployment for myTrimmy-prep: (1) Read .deploy-config.json, (2) Deploy to Supabase using MCP tools if not already deployed, (3) Deploy to Vercel, (4) Run health checks (connectivity, homepage, API), (5) Update manifest to &#x27;complete&#x27; status. Report final URLs and any issues.
```


---

## Troubleshooting Skills

Use these when things go wrong:

### `/root-cause-analysis`
> Debug failures systematically

**Prompt:**
```
Investigate build/test failures in myTrimmy-prep using 5 Whys analysis. Find the true root cause.
```


---

## Reference

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/planning` | Capture requirements and design before coding | After Phase 0 |
| `/architecture-patterns` | Review architecture against Clean Architecture, Hexagonal, and DDD patterns | After Phase 0 |
| `/type-first-design` | Design types and contracts before implementation | After Phase 1 |
| `/postgresql-design` | Review PostgreSQL schema for best practices and performance | After Phase 2 |
| `/security-integration` | Enforce security-first development practices | After Phase 2 |
| `/api-design` | Review API design against REST/GraphQL best practices | After Phase 4 |
| `/mcp-builder` | Create MCP servers for external service integration | After Phase 3 |
| `/stripe-integration` | Implement Stripe payment processing for subscriptions and one-time payments | After Phase 3 |
| `/logo-generator` | Generate logo and branding assets | After Phase 5 |
| `/frontend-design:frontend-design` | Create distinctive, production-grade UI components | After Phase 5 |
| `/ui-best-practices` | Build accessible, WCAG-compliant components | After Phase 5 |
| `/user-journey-audit` | Verify all user flows work end-to-end before UX evaluation | After Phase 5 |
| `/ux-audit` | Evaluate UX quality and identify friction points (runs AFTER journey verification) | After Phase 5 |
| `/webapp-testing` | Set up Playwright E2E tests | After Phase 6 |
| `/no-mocks-policy` | Enforce production-first testing philosophy | After Phase 6 |
| `/code-review` | Catch bugs, security issues, and design problems | After generation |
| `/code-review:code-review` | Pull request style code review | After generation |
| `/root-cause-analysis` | Debug failures systematically | When errors occur |
| `/docs-to-requirements` | Reverse engineer products from documentation | Before starting |
| `/production-ready-audit` | Comprehensive production readiness audit - orchestrates all specialized audits | After generation |
| `/changelog-generator` | Create user-facing changelogs from commits | After release |
| `/skill-creator` | Create new Claude Code skills | Anytime |
| `/run-skills` | Execute the skill execution plan generated by the scaffolder | After generation |
| `/supabase-deploy` | Deploy database schema to Supabase using MCP tools | After Phase 7 |
| `/vercel-deploy` | Deploy frontend to Vercel production | After Phase 7 |
| `/full-deploy` | Complete deployment to Supabase + Vercel with health checks | After Phase 7 |

---

## Tips

1. **Run skills in phase order** - Earlier phases inform later ones
2. **Architecture/DB/API first** - Review patterns before UI work
3. **Logo before UI** - Branding affects UI decisions
4. **Code review last** - Catch issues after all generation
5. **Use troubleshooting skills** when builds fail

## Need a Custom Skill?

Run `/skill-creator` to create project-specific automation.

---

## External References

These skills are enhanced with patterns from [wshobson/agents](https://github.com/wshobson/agents):

| Skill | Reference Documentation |
|-------|------------------------|
| Architecture Patterns | [Clean Architecture, Hexagonal, DDD](https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/architecture-patterns) |
| PostgreSQL Design | [Table design, indexing, constraints](https://github.com/wshobson/agents/tree/main/plugins/database-design/skills/postgresql-table-design) |
| API Design | [REST/GraphQL principles](https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/api-design-principles) |
| Stripe Integration | [Payments, subscriptions, webhooks](https://github.com/wshobson/agents/tree/main/plugins/payment-processing/skills/stripe-integration) |
| Security Scanning | [Attack trees, SAST](https://github.com/wshobson/agents/tree/main/plugins/security-scanning) |

### Additional Agents Repo Plugins (for manual reference)

- **TDD Workflows**: Test-driven development patterns
- **Deployment Validation**: Pre/post deployment checks
- **Observability**: Logging, metrics, tracing
- **Performance Testing**: Load testing, profiling
- **Kubernetes Operations**: K8s deployment patterns
