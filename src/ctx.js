import { getInput, info, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'

import { STATUS_DEFAULTS } from './const.js'

const token = getInput('token', { required: true })
const projectNumber = Number(getInput('project', { required: true }))
const targetStatus = getInput('moveTo') || STATUS_DEFAULTS.TARGET
const sourceStatus = getInput('watch') || STATUS_DEFAULTS.SOURCE

const owner = context.repo.owner
const actionType = context.payload.action
const issueAssignees = context.payload.issue.assignees
const issueNumber = context.payload.issue.number

const octokit = getOctokit(token)

export const $ctx = {
  actionType,
  info,
  issueAssignees,
  issueNumber,
  octokit,
  owner,
  projectNumber,
  setFailed,
  sourceStatus,
  targetStatus,
}
