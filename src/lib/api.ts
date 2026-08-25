import { Group, Member } from '../types/stream';
import { Beneficiary } from '../types/beneficiary';
import { LegacyMoment } from '../types/legacyMoment';

/**
 * Client for the Aegis Protocol API.
 *
 * The frontend is served by the same process as the API, so the default base is
 * a relative path — same origin, no CORS. `VITE_API_URL` exists for running the
 * Vite dev server against a separately hosted API.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/**
 * The session token, held in memory only.
 *
 * Deliberately not in `localStorage`: a token there survives the tab and is
 * readable by any script that manages to run on the page.
 */
let sessionToken: string | null = null;

export const setSessionToken = (token: string | null) => {
  sessionToken = token;
};

export const hasSession = () => sessionToken !== null;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const request = async <T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> => {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  const response = await fetch(`${API_BASE}/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}.`;

    // An expired session should not leave a stale token attached to later calls.
    if (response.status === 401) {
      sessionToken = null;
    }

    throw new ApiError(message, response.status);
  }

  return payload as T;
};

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface WalletSession {
  token: string;
  walletAddress: string;
  expiresAt: number;
}

export const authApi = {
  requestNonce: (address: string) =>
    request<{ nonce: string; message: string }>('/auth/nonce', {
      method: 'POST',
      body: { address },
    }),

  verifySignature: (address: string, nonce: string, signature: string) =>
    request<WalletSession>('/auth/verify', {
      method: 'POST',
      body: { address, nonce, signature },
    }),

  signOut: () => request<{ ok: boolean }>('/auth/sign-out', { method: 'POST' }),
};

// ---------------------------------------------------------------------------
// Hedera
// ---------------------------------------------------------------------------

export const hederaApi = {
  createTopic: (memo: string, transactionMemo?: string) =>
    request<{ topicId: string; transactionId: string }>('/hedera/topics', {
      method: 'POST',
      body: { memo, transactionMemo },
    }),

  submitMessage: (topicId: string, message: string) =>
    request<{ sequenceNumber: string | null; transactionId: string }>(
      '/hedera/messages',
      { method: 'POST', body: { topicId, message } }
    ),

  resolveEvmAddress: (idOrAlias: string) =>
    request<{ evmAddress: `0x${string}` }>(
      `/hedera/accounts/${encodeURIComponent(idOrAlias)}/evm-address`
    ).then((result) => result.evmAddress),
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  wallet_address: string;
  chain_id?: number;
  first_connected_at: string;
  last_connected_at: string;
  connection_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// The signed-in wallet is taken from the session on the server, so none of
// these calls pass an address.
export const walletAccountService = {
  recordConnection: (chainId?: number) =>
    request<User>('/users/me/connect', { method: 'POST', body: { chainId } }),

  getCurrentUser: () => request<User | null>('/users/me'),

  markInactive: () => request<{ ok: boolean }>('/users/me/disconnect', { method: 'POST' }),
};

// ---------------------------------------------------------------------------
// Stream
// ---------------------------------------------------------------------------

export const streamService = {
  getGroups: () => request<Group[]>('/groups'),

  createGroup: (input: {
    groupName: string;
    releaseDateTime: string;
    topicId: string;
    txid: string;
  }) => request<Group>('/groups', { method: 'POST', body: input }),

  addMemberToGroup: (
    groupId: string,
    member: { name: string; address: string; amount: number }
  ) => request<Member>(`/groups/${groupId}/members`, { method: 'POST', body: member }),

  removeMember: (groupId: string, memberId: string) =>
    request<{ ok: boolean }>(`/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  scheduleGroup: (groupId: string) =>
    request<Group>(`/groups/${groupId}/schedule`, { method: 'POST' }),

  releaseGroup: (groupId: string) =>
    request<Group>(`/groups/${groupId}/release`, { method: 'POST' }),

  deleteGroup: (groupId: string) =>
    request<{ ok: boolean }>(`/groups/${groupId}`, { method: 'DELETE' }),
};

// ---------------------------------------------------------------------------
// Relay
// ---------------------------------------------------------------------------

export interface Relay {
  id: string;
  relay_number: string;
  sender_address: string;
  receiver_address: string;
  amount: number;
  status:
    | "Waiting for Receiver's Approval"
    | 'Waiting for Sender to Execute'
    | 'Complete'
    | 'Rejected'
    | 'Expired';
  transaction_hash?: string;
  topic_id?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const relayService = {
  getRelays: () => request<Relay[]>('/relays'),

  createRelay: (input: {
    receiverAddress: string;
    amount: number;
    expiresAt?: string;
    topicId?: string;
  }) => request<Relay>('/relays', { method: 'POST', body: input }),

  approveRelay: (relayId: string) =>
    request<Relay>(`/relays/${relayId}/approve`, { method: 'POST' }),

  rejectRelay: (relayId: string) =>
    request<Relay>(`/relays/${relayId}/reject`, { method: 'POST' }),

  executeRelay: (relayId: string, transactionHash: string) =>
    request<Relay>(`/relays/${relayId}/execute`, {
      method: 'POST',
      body: { transactionHash },
    }),

  cancelRelay: (relayId: string) =>
    request<Relay>(`/relays/${relayId}/cancel`, { method: 'POST' }),
};

// ---------------------------------------------------------------------------
// Legacy
// ---------------------------------------------------------------------------

export interface LegacyPlan {
  id: string;
  wallet_address: string;
  moment_type: 'specificDate' | 'ifImGone';
  moment_value: string;
  moment_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const legacyService = {
  getLegacyPlan: () => request<LegacyPlan | null>('/legacy/plan'),

  saveLegacyPlan: (moment: LegacyMoment) =>
    request<LegacyPlan>('/legacy/plan', { method: 'PUT', body: moment }),

  getBeneficiaries: () => request<Beneficiary[]>('/legacy/beneficiaries'),

  addBeneficiary: (beneficiary: Omit<Beneficiary, 'id'>) =>
    request<Beneficiary>('/legacy/beneficiaries', {
      method: 'POST',
      body: beneficiary,
    }),

  updateBeneficiary: (id: string, beneficiary: Omit<Beneficiary, 'id'>) =>
    request<Beneficiary>(`/legacy/beneficiaries/${id}`, {
      method: 'PUT',
      body: beneficiary,
    }),

  deleteBeneficiary: (id: string) =>
    request<{ ok: boolean }>(`/legacy/beneficiaries/${id}`, { method: 'DELETE' }),
};
