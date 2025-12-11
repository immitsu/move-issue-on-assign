/**
 * Mock for GraphQL query responses.
 * Used to mock the `../src/queries`.
 */

const DEFAULT_PROJECT = {
  id: 'h12htj89',
  number: 1,
  title: 'Test Project',
}

const DEFAULT_ISSUE = {
  content: { number: 1 },
  fieldValueByName: { name: 'Todo' },
  id: '123zgM4o_1',
}

export const mockGetProjectQuery = (overrides = {}) => {
  const { projectInfo, statusOptions } = overrides

  return {
    organization: {
      projectV2: {
        ...DEFAULT_PROJECT,
        fields: {
          nodes: [
            {
              id: '123456zgM4qZo',
              name: 'Status',
              options:
                statusOptions !== undefined
                  ? statusOptions
                  : [
                      { id: 'f75ad846', name: 'Todo' },
                      { id: '47fc9ee4', name: 'In Progress' },
                      { id: '98236657', name: 'Done' },
                    ],
            },
          ],
        },
        ...projectInfo,
      },
    },
  }
}

export const mockCollectIssuesQuery = (overrides = {}) => {
  const { projectInfo, projectIssues } = overrides

  const nodes = Array.isArray(projectIssues) ? projectIssues : [DEFAULT_ISSUE]

  return {
    organization: {
      projectV2: {
        ...DEFAULT_PROJECT,
        items: {
          nodes,
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
          },
        },
        ...projectInfo,
      },
    },
  }
}

export const mockMoveIssueMutation = (itemId = DEFAULT_ISSUE.id) => ({
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: itemId,
    },
  },
})

export const mockIssue = ({ id, number, status = 'Todo' }) => ({
  content: { number },
  fieldValueByName: { name: status },
  id: id || `id_${number}`,
})

export const isGetProjectQueryMockImplementation = query =>
  query.includes('ProjectV2Field')

export const isCollectIssuesQueryMockImplementation = query =>
  query.includes('hasNextPage')

export const isMoveIssueMutationMockImplementation = query =>
  query.includes('updateProjectV2ItemFieldValue')
