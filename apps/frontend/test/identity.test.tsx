import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IdentityProvider, useIdentity } from '../src/IdentityContext'

vi.mock('../src/workspace/api', () => ({
  api: vi.fn()
}))
import { api } from '../src/workspace/api'

function Probe() { const { identity, progress } = useIdentity(); return <output>{identity?.user?.login ?? 'signed-out'}:{progress.length}</output> }

describe('identity account transitions', () => {
  it('clears prior account progress while the next identity is loading', async () => {
    let resolve!: (value: any) => void
    vi.mocked(api).mockResolvedValueOnce({ user: { id: 'one', login: 'one' } } as any).mockResolvedValueOnce({ challenges: [{ challenge_id: '001' }] } as any).mockResolvedValueOnce({ user: { id: 'two', login: 'two' } } as any).mockImplementationOnce(() => new Promise(r => { resolve = r }))
    render(<IdentityProvider><Probe /></IdentityProvider>)
    await waitFor(() => expect(screen.getByText('one:1')).toBeInTheDocument())
    await act(async () => window.dispatchEvent(new Event('focus')))
    await waitFor(() => expect(screen.getByText('two:0')).toBeInTheDocument())
    await act(async () => resolve({ challenges: [] }))
  })
})
