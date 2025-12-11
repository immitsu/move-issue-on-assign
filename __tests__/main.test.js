import { jest } from '@jest/globals'

import { info, octokit, setFailed } from '../__fixtures__/core.js'
import { ctx, resetCtx } from '../__fixtures__/ctx.js'
import {
  isCollectIssuesQueryMockImplementation,
  isMoveIssueMutationMockImplementation,
  mockCollectIssuesQuery,
  mockGetProjectQuery,
  mockIssue,
  mockMoveIssueMutation,
} from '../__fixtures__/queries.js'

jest.unstable_mockModule('../src/ctx.js', () => ({ $ctx: ctx }))

const { run } = await import('../src/main.js')

describe('main.js', () => {
  beforeEach(() => {
    resetCtx()
  })

  it('moves issue successfully with default mocks', async () => {
    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery()
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(info).toHaveBeenCalledWith(
      'Successfully moved issue #1 to "In Progress" in project "Test Project"',
    )
  })

  it('handles custom project title', async () => {
    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery()
      }
      return mockGetProjectQuery({
        projectInfo: {
          title: 'Custom Project Name',
        },
      })
    })

    await run()

    expect(info).toHaveBeenCalledWith(
      'Successfully moved issue #1 to "In Progress" in project "Custom Project Name"',
    )
  })

  it('handles multiple issues in different states', async () => {
    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery({
          projectIssues: [
            mockIssue({ number: 1, status: 'Todo' }),
            mockIssue({ number: 2, status: 'In Progress' }),
            mockIssue({ number: 3, status: 'Done' }),
          ],
        })
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(info).toHaveBeenCalledWith(
      'Successfully moved issue #1 to "In Progress" in project "Test Project"',
    )
  })

  it('skips when no action required (unassigned with assignees)', async () => {
    ctx.actionType = 'unassigned'
    ctx.issueAssignees = [{ login: 'test-user' }]

    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery({
          projectIssues: [mockIssue({ number: 1, status: 'In Progress' })],
        })
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(info).toHaveBeenCalledWith('No action required – skipping')
  })

  it('handles unassigned with no assignees', async () => {
    ctx.actionType = 'unassigned'
    ctx.issueAssignees = []

    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery({
          projectIssues: [mockIssue({ number: 1, status: 'In Progress' })],
        })
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(info).toHaveBeenCalledWith(
      'Successfully moved issue #1 to "Todo" in project "Test Project"',
    )
  })

  it('skips when no issues require watching', async () => {
    octokit.mockImplementation(query => {
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery({ projectIssues: [] })
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(info).toHaveBeenCalledWith('No issues require watching – skipping')
  })

  it('skips when issue not found', async () => {
    octokit.mockImplementation(query => {
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery({
          projectIssues: [mockIssue({ number: 2, status: 'Todo' })],
        })
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(info).toHaveBeenCalledWith('Issue not found – skipping')
  })

  it('fails when project not found', async () => {
    octokit.mockImplementation(() => ({
      organization: { projectV2: null },
    }))

    await run()

    expect(setFailed).toHaveBeenCalledWith('Project not found')
  })

  it('fails when status field not found', async () => {
    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery()
      }
      return mockGetProjectQuery({
        projectInfo: {
          fields: {
            nodes: [],
          },
        },
      })
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith('Status field not found')
  })

  it('fails when status field has no options', async () => {
    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery()
      }
      return mockGetProjectQuery({
        statusOptions: null,
      })
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith('Status field has no options')
  })

  it('fails when target status option not found', async () => {
    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        return mockMoveIssueMutation()
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery()
      }
      return mockGetProjectQuery({
        statusOptions: [
          { id: 'f75ad846', name: 'Todo' },
          { id: '98236657', name: 'Done' },
        ],
      })
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith(
      'Status option not found ("In Progress")',
    )
  })

  it('fails when GraphQL mutation throws error', async () => {
    octokit.mockImplementation(query => {
      if (isMoveIssueMutationMockImplementation(query)) {
        throw new Error('GraphQL mutation failed')
      }
      if (isCollectIssuesQueryMockImplementation(query)) {
        return mockCollectIssuesQuery()
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith('GraphQL mutation failed')
  })

  it('fails when getProject query throws error', async () => {
    octokit.mockImplementation(query => {
      if (isCollectIssuesQueryMockImplementation(query)) {
        throw new Error('Project query failed')
      }
      return mockGetProjectQuery()
    })

    await run()

    expect(setFailed).toHaveBeenCalledWith('Project query failed')
  })
})
