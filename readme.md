# Move Issue on Assign

A GitHub Action to automatically move issues between columns in GitHub Projects V2 when they are assigned or unassigned.

**Note on Compatibility:** GitHub Projects can belong to organizations, users, or repositories. This action currently supports only organization projects.

## Usage

```yaml
name: Move assigned issues
on:
  issues:
    types: [assigned]

jobs:
  move-issue:
    runs-on: ubuntu-latest
    steps:
      - name: Move issue on assign
        uses: immitsu/move-issue-on-assign@v2
        with:
          token: ${{ secrets.PROJECT_PAT }}
          project: 1
          watch: 'Todo, Backlog'
          move-to: 'In Progress'
```

For tracking assignment changes, use:

```yaml
on:
  issues:
    types: [assigned, unassigned]
```

In that case, issues that become completely unassigned and are currently in the "move-to" column automatically move back to the first "watch" column.

## Inputs

- **token** [required]: Fine-grained token with permissions for organization projects (read/write) and repository issues (read);
- **project** [required]: Project number (found in project URL);
- **watch** [optional]: Column names to watch for assigned issues (comma-separated), default: `Todo`;
- **move-to** [optional]: Column to move issue to when assigned, default: `In Progress`.
