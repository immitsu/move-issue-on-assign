import { getInput, info, notice, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'

import { ACTIONS, MESSAGES, STATUS_DEFAULTS } from './const.mjs'
import collectIssuesQuery from './queries/collect-issues.gql'
import getProjectQuery from './queries/get-project.gql'
import moveIssueMutation from './queries/move-issue.gql'
import { invariant } from './utils.mjs'

const TOKEN = getInput('token', { required: true })
const OWNER = getInput('owner', { required: true })
const PROJECT_NUMBER = Number(getInput('project'), { required: true })
const TARGET_STATUS = getInput('moveTo') || STATUS_DEFAULTS.TARGET
const SOURCE_STATUS = getInput('watch') || STATUS_DEFAULTS.SOURCE
const SOURCE_STATUS_ARR = SOURCE_STATUS.split(',').map(s => s.trim())

invariant(
  Number.isInteger(PROJECT_NUMBER) && PROJECT_NUMBER > 0,
  `Project number must be a positive integer, got: ${PROJECT_NUMBER}`,
)

const ACTION = context.payload.action
const ISSUE_ASSIGNEES = context.payload.issue.assignees
const ISSUE_NUMBER = context.payload.issue.number

const octokit = getOctokit(TOKEN)

const getActionBasedQueryParams = () => {
  const wasAssigned = ACTION === ACTIONS.ASSIGNED

  if (wasAssigned) {
    return {
      issuesFilter: SOURCE_STATUS_ARR,
      targetStatus: TARGET_STATUS,
    }
  }

  const wasUnassigned = ACTION === ACTIONS.UNASSIGNED
  const shouldMoveBack = wasUnassigned && !ISSUE_ASSIGNEES?.length

  if (shouldMoveBack) {
    return {
      issuesFilter: [TARGET_STATUS],
      targetStatus: SOURCE_STATUS_ARR[0],
    }
  }
}

const getProject = async () => {
  const response = await octokit.graphql(getProjectQuery, {
    owner: OWNER,
    projectNumber: PROJECT_NUMBER,
  })

  invariant(response.organization.projectV2, MESSAGES.PROJECT_NOT_FOUND)

  return response.organization.projectV2
}

const getProjectIssuesByFilter = async filter => {
  let issues = []
  let hasNextPage = false
  let endCursor = null

  do {
    const response = await octokit.graphql(collectIssuesQuery, {
      after: endCursor,
      owner: OWNER,
      projectNumber: PROJECT_NUMBER,
    })

    invariant(response.organization.projectV2, MESSAGES.PROJECT_NOT_FOUND)

    const { items } = response.organization.projectV2
    const { nodes, pageInfo } = items

    const filteredIssues = nodes.filter(item => {
      const status = item.fieldValueByName.name
      return filter.includes(status)
    })

    issues = issues.concat(filteredIssues)
    hasNextPage = pageInfo.hasNextPage
    endCursor = pageInfo.endCursor
  } while (hasNextPage)

  return issues
}

const skipWithNotice = message => {
  notice(`${message} – skipping`)
}

const main = async () => {
  try {
    const queryParams = getActionBasedQueryParams()

    if (!queryParams) {
      skipWithNotice(MESSAGES.NO_ACTION_REQUIRED)
      return
    }

    const { issuesFilter, targetStatus } = queryParams

    const [project, issues] = await Promise.all([
      getProject(),
      getProjectIssuesByFilter(issuesFilter),
    ])

    if (issues.length === 0) {
      skipWithNotice(MESSAGES.NO_WATCH_ISSUES)
      return
    }

    const issue = issues.find(x => x.content.number == ISSUE_NUMBER)

    if (!issue) {
      skipWithNotice(MESSAGES.ISSUE_NOT_FOUND)
      return
    }

    const statusField = project.fields.nodes.find(n => n.name === 'Status')

    invariant(statusField, MESSAGES.STATUS_FIELD_NOT_FOUND)

    invariant(statusField.options, MESSAGES.STATUS_FIELD_NO_OPTIONS)

    const statusOption = statusField.options.find(o => o.name === targetStatus)

    invariant(
      statusOption,
      `${MESSAGES.STATUS_OPTION_NOT_FOUND} ("${targetStatus}")`,
    )

    await octokit.graphql(moveIssueMutation, {
      fieldId: statusField.id,
      issueId: issue.id,
      optionId: statusOption.id,
      projectId: project.id,
    })

    info(
      `Successfully moved issue #${ISSUE_NUMBER} to "${targetStatus}" in project "${project.title}"`,
    )
  } catch (error) {
    setFailed(error.message)
  }
}

main()
