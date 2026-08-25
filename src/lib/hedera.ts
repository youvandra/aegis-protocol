import { parseEther } from 'viem';

const MIRROR_NODE_URL =
  import.meta.env.VITE_HEDERA_MIRROR_NODE_URL ??
  'https://testnet.mirrornode.hedera.com';

interface MirrorAccount {
  account: string;
  evm_address: string;
}

const fetchAccount = async (idOrAliasOrEvmAddress: string): Promise<MirrorAccount> => {
  const response = await fetch(
    `${MIRROR_NODE_URL}/api/v1/accounts/${encodeURIComponent(idOrAliasOrEvmAddress)}?limit=1&order=desc`
  );

  if (!response.ok) {
    throw new Error(
      `Hedera account "${idOrAliasOrEvmAddress}" could not be resolved (mirror node returned ${response.status}).`
    );
  }

  const account = (await response.json()) as Partial<MirrorAccount>;

  if (!account?.account || !account?.evm_address) {
    throw new Error(`Hedera account "${idOrAliasOrEvmAddress}" has no usable address.`);
  }

  return account as MirrorAccount;
};

/**
 * Resolve any Hedera account reference to its EVM address (`0x…`).
 *
 * Uses the public mirror node, so unlike `AccountInfoQuery` it needs no
 * operator key and can safely run in the browser.
 */
export const resolveEvmAddress = async (
  idOrAliasOrEvmAddress: string
): Promise<`0x${string}`> => {
  const { evm_address } = await fetchAccount(idOrAliasOrEvmAddress);
  return evm_address as `0x${string}`;
};

/** Resolve an EVM address to its Hedera account ID (`0.0.x`). */
export const resolveHederaAccountId = async (evmAddress: string): Promise<string> => {
  const { account } = await fetchAccount(evmAddress);
  return account;
};

/** The account that receives scheduled stream deposits. */
export const treasuryAccountId = import.meta.env.VITE_HEDERA_ACCOUNT_ID as string;

/**
 * Convert an HBAR amount to the value unit used by Hedera's JSON-RPC relay
 * (weibar, 18 decimals).
 *
 * Accepts decimal strings and never goes through a float, so fractional
 * amounts survive intact.
 */
export const hbarToWei = (amount: string | number): bigint => {
  const normalized = typeof amount === 'number' ? amount.toString() : amount.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`"${amount}" is not a valid HBAR amount.`);
  }

  return parseEther(normalized);
};

/** Sum a list of HBAR amounts exactly, in weibar. */
export const sumHbarToWei = (amounts: Array<string | number | null | undefined>): bigint =>
  amounts.reduce<bigint>(
    (total, amount) => total + hbarToWei(amount ?? 0),
    0n
  );
