import { supabase } from './supabase';

/**
 * Call a Supabase edge function and surface its error message.
 *
 * `functions.invoke` reports every non-2xx as the same opaque string and hides
 * the response on `error.context`, so a "nonce expired" and a misconfigured
 * operator key look identical. Reading the body back makes the real reason
 * available to the UI.
 */
export const invokeFunction = async <T>(
  name: string,
  body: Record<string, unknown>
): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });

  if (error) {
    const context = (error as { context?: Response }).context;

    if (context && typeof context.json === 'function') {
      try {
        const payload = await context.clone().json();
        if (payload?.error) {
          throw new Error(payload.error);
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== error.message) {
          throw parseError;
        }
      }
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`${name} returned an empty response.`);
  }

  return data;
};
