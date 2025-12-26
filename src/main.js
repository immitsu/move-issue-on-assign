import {
  ACTIONS,
  MESSAGES,
  PAGINATION_LIMIT,
  STATUS_FIELD_NAME_FROM_GH,
} from './const.js'
import { $ctx } from './ctx.js'
import collectIssuesQuery from './queries/collect-issues.gql'
import getProjectQuery from './queries/get-project.gql'
import moveIssueMutation from './queries/move-issue.gql'
import { delimitString, invariant } from './utils.js'

invariant(
  Number.isInteger($ctx.projectNumber) && $ctx.projectNumber > 0,
  `Project number must be a positive integer, got: ${$ctx.projectNumber}`,
)

const getProject = async () => {
  const response = await $ctx.octokit.graphql(getProjectQuery, {
    owner: $ctx.owner,
    projectNumber: $ctx.projectNumber,
  })

  const project = response.organization.projectV2

  invariant(project, MESSAGES.PROJECT_NOT_FOUND)

  return project
}

const getProjectIssuesByFilter = async filter => {
  const filterSet = new Set(filter)

  let issues = []
  let hasNextPage = false
  let endCursor = null
  let iteration = 0

  do {
    invariant(++iteration <= PAGINATION_LIMIT, MESSAGES.PAGINATION_LIMIT)

    const response = await $ctx.octokit.graphql(collectIssuesQuery, {
      after: endCursor,
      owner: $ctx.owner,
      projectNumber: $ctx.projectNumber,
    })

    const project = response.organization.projectV2

    invariant(project, MESSAGES.PROJECT_NOT_FOUND)

    if (!project.items) return

    const { nodes, pageInfo } = project.items

    hasNextPage = pageInfo.hasNextPage
    endCursor = pageInfo.endCursor

    if (!nodes) continue

    const filteredIssues = nodes.filter(
      n => n.fieldValueByName && filterSet.has(n.fieldValueByName.name),
    )

    issues = issues.concat(filteredIssues)
  } while (hasNextPage)

  return issues
}

const getActionParams = () => {
  const defaultParams = {
    getFrom: delimitString($ctx.sourceStatus),
    moveTo: $ctx.targetStatus,
  }

  if ($ctx.actionType === ACTIONS.ASSIGNED) {
    return defaultParams
  }

  if (
    $ctx.actionType === ACTIONS.UNASSIGNED &&
    $ctx.issueAssignees.length === 0
  ) {
    return {
      getFrom: [defaultParams.moveTo],
      moveTo: defaultParams.getFrom[0],
    }
  }
}

const infoWithSkipping = message => {
  $ctx.info(`${message} – skipping`)
}

export const run = async () => {
  try {
    const actionParams = getActionParams()

    if (!actionParams) {
      infoWithSkipping(MESSAGES.NO_ACTION_REQUIRED)
      return
    }

    const { getFrom, moveTo } = actionParams

    const [project, issues] = await Promise.all([
      getProject(),
      getProjectIssuesByFilter(getFrom),
    ])

    if (issues.length === 0) {
      infoWithSkipping(MESSAGES.NO_WATCH_ISSUES)
      return
    }

    const issue = issues.find(
      i => i.content && i.content.number == $ctx.issueNumber,
    )

    if (!issue) {
      infoWithSkipping(MESSAGES.ISSUE_NOT_FOUND)
      return
    }

    const statusField = project.fields.nodes.find(
      n => n.name === STATUS_FIELD_NAME_FROM_GH,
    )

    invariant(statusField, MESSAGES.STATUS_FIELD_NOT_FOUND)

    invariant(statusField.options, MESSAGES.STATUS_FIELD_NO_OPTIONS)

    const statusOption = statusField.options.find(o => o.name === moveTo)

    invariant(statusOption, `${MESSAGES.STATUS_OPTION_NOT_FOUND} ("${moveTo}")`)

    await $ctx.octokit.graphql(moveIssueMutation, {
      fieldId: statusField.id,
      issueId: issue.id,
      optionId: statusOption.id,
      projectId: project.id,
    })

    $ctx.info(
      `Successfully moved issue #${$ctx.issueNumber} to "${moveTo}" in project "${project.title}"`,
    )
  } catch (error) {
    $ctx.setFailed(error.message)
  }
}
