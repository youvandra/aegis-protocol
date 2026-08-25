import { parseEther } from 'viem';

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
  amounts.reduce<bigint>((total, amount) => total + hbarToWei(amount ?? 0), 0n);
