import { getInput, info, notice, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'

import { ACTIONS, MESSAGES, STATUS_DEFAULTS } from './const.js'
import collectIssuesQuery from './queries/collect-issues.gql'
import getProjectQuery from './queries/get-project.gql'
import moveIssueMutation from './queries/move-issue.gql'
import { invariant, splitString } from './utils.js'

const $token = getInput('token', { required: true })
const $projectNumber = Number(getInput('project'), { required: true })
const $targetStatus = getInput('moveTo') || STATUS_DEFAULTS.TARGET
const $sourceStatus = getInput('watch') || STATUS_DEFAULTS.SOURCE
const $sourceStatusArr = splitString($sourceStatus)

invariant(
  Number.isInteger($projectNumber) && $projectNumber > 0,
  `Project number must be a positive integer, got: ${$projectNumber}`,
)

const $owner = context.repo.owner
const $action = context.payload.action
const $issueAssignees = context.payload.issue.assignees
const $issueNumber = context.payload.issue.number

const $octokit = getOctokit($token)

const getActionBasedQueryParams = () => {
  const wasAssigned = $action === ACTIONS.ASSIGNED

  if (wasAssigned) {
    return {
      issuesFilter: $sourceStatusArr,
      targetStatus: $targetStatus,
    }
  }

  const wasUnassigned = $action === ACTIONS.UNASSIGNED
  const shouldMoveBack = wasUnassigned && !$issueAssignees?.length

  if (shouldMoveBack) {
    return {
      issuesFilter: [$targetStatus],
      targetStatus: $sourceStatusArr[0],
    }
  }
}

const getProject = async () => {
  const response = await $octokit.graphql(getProjectQuery, {
    owner: $owner,
    projectNumber: $projectNumber,
  })

  invariant(response.organization.projectV2, MESSAGES.PROJECT_NOT_FOUND)

  return response.organization.projectV2
}

const getProjectIssuesByFilter = async filter => {
  let issues = []
  let hasNextPage = false
  let endCursor = null

  do {
    const response = await $octokit.graphql(collectIssuesQuery, {
      after: endCursor,
      owner: $owner,
      projectNumber: $projectNumber,
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

export const run = async () => {
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

    const issue = issues.find(x => x.content.number == $issueNumber)

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

    await $octokit.graphql(moveIssueMutation, {
      fieldId: statusField.id,
      issueId: issue.id,
      optionId: statusOption.id,
      projectId: project.id,
    })

    info(
      `Successfully moved issue #${$issueNumber} to "${targetStatus}" in project "${project.title}"`,
    )
  } catch (error) {
    setFailed(error.message)
  }
}
