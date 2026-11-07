## Summary

<!-- What does this PR change and why? -->

## Phase / module

- Phase: F<number>
- Modules touched:

## Golden rules checklist

- [ ] Branch created from the latest `dev` (`git switch -c feat/f<phase>-<slug> dev`).
- [ ] I did not commit directly to `dev` or `main`.
- [ ] If this PR changes the database or Prisma, I ran `npm run db:backup -- --label <label>`.
- [ ] If this PR changes the database, `docs/revert/PR-<number>.md` is complete.
- [ ] Tag `pre-merge-pr-<number>` created on `dev` before merging.
- [ ] No campaign data, real vault path, secrets or `.env` included.
- [ ] `PENDIENTES.md` updated.

## Verification

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run privacy:check`
- [ ] Manual check of the affected feature

## Database impact

- Migrations:
- Backup path:
- Rollback strategy:

## Screenshots / notes

<!-- UI changes only. Use the fictional demo campaign, never a real one. -->
