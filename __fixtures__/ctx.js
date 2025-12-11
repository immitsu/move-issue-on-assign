/**
 * Mock for `../src/ctx.js` module.
 */

import { ACTIONS, STATUS_DEFAULTS } from '../src/const.js'
import { info, octokit, setFailed } from './core.js'

const createCtx = () => ({
  actionType: ACTIONS.ASSIGNED,
  info,
  issueAssignees: [{ login: 'test-user' }],
  issueNumber: 1,
  octokit: { graphql: octokit },
  owner: 'test-owner',
  projectNumber: 1,
  setFailed,
  sourceStatus: STATUS_DEFAULTS.SOURCE,
  targetStatus: STATUS_DEFAULTS.TARGET,
})

export const ctx = createCtx()

export const resetCtx = () => Object.assign(ctx, createCtx())
