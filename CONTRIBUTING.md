# Contributing to Atlas Sales OS

Thank you for contributing. This project follows a structured development process designed for production-grade SaaS delivery.

## Before You Start

1. Read the [Product Charter](docs/product/charter.md) to understand what we're building
2. Check the [Milestone Plan](docs/milestones/milestone-plan.md) — only work on the current milestone
3. Review [Development Workflow](docs/development/workflow.md) and [Coding Standards](docs/development/coding-standards.md)

## Quick Start (After M0)

Setup instructions will be in [docs/development/environment-setup.md](docs/development/environment-setup.md).

## Pull Requests

- Branch from the current milestone branch (or `main`)
- Follow [Conventional Commits](docs/development/git-strategy.md)
- Keep PRs focused (< 400 lines when possible)
- Include tests for business logic and security-sensitive code
- Update documentation when behavior or architecture changes

## Architectural Changes

Significant technical decisions require an [Architecture Decision Record](docs/architecture/adrs/README.md). Create an ADR with status `Proposed` before implementing.

## Code Review

All PRs require at least one approval. Reviewers check correctness, security, multi-tenancy, and consistency with existing patterns.

## Questions

Refer to the [documentation index](docs/README.md) first. For scope or architecture questions, discuss before implementing.
