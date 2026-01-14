# Skill Execution Checklist

Run these skills after scaffolding to ensure production-readiness.

---

## 🚨 CRITICAL SKILLS (Must Pass Before Deploy)

> **These skills MUST complete successfully before deploying to production.**
> Run in Claude Code with `/run-skills` or execute each skill individually.

| # | Skill | Phase | Description |
|---|-------|-------|-------------|
| 1 | `/type-first-design` | 1 | Design types and contracts before implementation |
| 2 | `/security-integration` | 2 | Enforce security-first development practices |
| 3 | `/user-journey-audit` | 5 | Verify all user flows work end-to-end before UX evaluation |
| 4 | `/webapp-testing` | 6 | Set up Playwright E2E tests |
| 5 | `/supabase-deploy` | 7 | Deploy database schema to Supabase using MCP tools |

### Quick Run Command

In Claude Code, run:
```
/run-skills
```

Or run each critical skill individually:
```
/type-first-design
/security-integration
/user-journey-audit
/webapp-testing
/supabase-deploy
```

---

## All Skills by Phase

### Phase 0

- [ ] `/planning`
  - Capture requirements and design before coding
- [ ] `/architecture-patterns`
  - Review architecture against Clean Architecture, Hexagonal, and DDD patterns

### Phase 1

- [ ] `/type-first-design` **[CRITICAL]**
  - Design types and contracts before implementation

### Phase 2

- [ ] `/postgresql-design`
  - Review PostgreSQL schema for best practices and performance
- [ ] `/security-integration` **[CRITICAL]**
  - Enforce security-first development practices

### Phase 3

- [ ] `/mcp-builder`
  - Create MCP servers for external service integration

### Phase 4

- [ ] `/api-design`
  - Review API design against REST/GraphQL best practices

### Phase 5

- [ ] `/logo-generator`
  - Generate logo and branding assets
- [ ] `/frontend-design:frontend-design`
  - Create distinctive, production-grade UI components
- [ ] `/ui-best-practices`
  - Build accessible, WCAG-compliant components
- [ ] `/user-journey-audit` **[CRITICAL]**
  - Verify all user flows work end-to-end before UX evaluation

### Phase 6

- [ ] `/webapp-testing` **[CRITICAL]**
  - Set up Playwright E2E tests
- [ ] `/no-mocks-policy`
  - Enforce production-first testing philosophy

### Phase 7

- [ ] `/supabase-deploy` **[CRITICAL]**
  - Deploy database schema to Supabase using MCP tools

---

## Summary

- **Total Skills**: 14
- **Critical Skills**: 5
- **Standard Skills**: 9
