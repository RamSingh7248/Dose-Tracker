# Dose Tracker Workspace Rules & Git Sync Guidelines

## Workspace Repository
- Remote: `origin` (`https://github.com/RamSingh7248/Dose-Tracker.git`)
- Branch: `main` (or current branch)
- DO NOT create new repositories, rewrite history (`reset --hard`), force push (`--force` / `--force-with-lease`), or delete commits/branches.

## Automatic GitHub Synchronization Workflow
For every meaningful completed task (feature, bug fix, UI change, security improvement, etc.):
1. **IMPLEMENT & TEST**: Implement changes and verify locally (`npm run build`, `npm test`, or relevant checks).
2. **INSPECT GIT STATUS**: Run `git status`, `git branch --show-current`, `git remote -v`.
3. **SEPARATE TASK CHANGES FROM PRE-EXISTING CHANGES**: Only stage files belonging to the task (`git add <specific-files>`). Never blindly `git add .` if unrelated pre-existing user changes exist.
4. **CHECK FOR SECRETS**: Verify no API keys, credentials, or sensitive `.env` files are being committed.
5. **COMMIT**: Use conventional commit format (e.g. `feat: ...`, `fix: ...`, `refactor: ...`, `perf: ...`, `style: ...`).
6. **PUSH & VERIFY**: Run `git push origin <current-branch>` and verify push success.
7. **REPORT**: Provide the standard status summary:
   - IMPLEMENTATION
   - TEST
   - GIT (Commit hash & message)
   - GITHUB (Sync status)

## Security & Secrets Safety
- Never commit `.env`, credentials, JWT secrets, passwords, or API keys.
- Preserve `.gitignore`.
