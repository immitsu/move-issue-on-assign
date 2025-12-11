/**
 * Mock for `@actions/core` module.
 */

import { jest } from '@jest/globals'

export const info = jest.fn()
export const octokit = jest.fn()
export const setFailed = jest.fn()
