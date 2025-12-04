# Move Issue on Assign

A GitHub Action to automatically move issues between columns in GitHub Projects when they are assigned or unassigned.

**Note:** This action currently supports only organization projects.
GitHub Projects can belong to organizations, users, or repositories.

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
        uses: immitsu/move-issue-on-assign@v1.0.0
        with:
          token: ${{ secrets.PROJECT_PAT }}
          project: 1
          owner: ${{ github.repository_owner }}
          watch: 'Todo, Backlog'
          moveTo: 'In Progress'
```

For tracking assignment changes, use:

```yaml
on:
  issues:
    types: [assigned, unassigned]
```

## Inputs

- **token** [required]: Fine-grained token with permissions for organization projects (read/write) and repository issues (read);
- **project** [required]: Project number (found in project URL);
- **owner** [required]: Organization name containing the project;
- **watch** [optional]: Column names to watch for assigned issues (comma-separated), default: `Todo`;
- **moveTo** [optional]: Column to move issue to when assigned, default: `In Progress`.
