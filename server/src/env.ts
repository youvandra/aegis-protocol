const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 8080),
  /** Where the SQLite file lives. Must be on a persistent volume. */
  databasePath: process.env.DATABASE_PATH ?? './data/aegis.db',
  /** Directory holding the built frontend (`dist` from the root package). */
  staticDir: process.env.STATIC_DIR ?? '../dist',

  hedera: {
    accountId: required('HEDERA_ACCOUNT_ID'),
    privateKey: required('HEDERA_PRIVATE_KEY'),
    network: process.env.HEDERA_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
    mirrorNodeUrl:
      process.env.HEDERA_MIRROR_NODE_URL ?? 'https://testnet.mirrornode.hedera.com',
  },

  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60),
  nonceTtlSeconds: Number(process.env.NONCE_TTL_SECONDS ?? 5 * 60),
} as const;
