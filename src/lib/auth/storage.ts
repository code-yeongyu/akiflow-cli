import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Credentials stored in secure storage
 */
export interface Credentials {
  token: string;
  clientId: string;
  expiryTimestamp: number;
}

/**
 * Platform detection for storage backend
 */
function isPlatformMacOS(): boolean {
  return process.platform === "darwin";
}

/**
 * Get XDG config directory path
 */
function getXDGConfigPath(): string {
  return join(homedir(), ".config", "af");
}

/**
 * Get XDG credentials file path
 */
function getXDGCredentialsPath(): string {
  return join(getXDGConfigPath(), "credentials.json");
}

/**
 * Ensure XDG config directory exists
 */
async function ensureXDGDirectory(): Promise<void> {
  const configPath = getXDGConfigPath();
  try {
    await Bun.file(configPath).exists();
  } catch {
    // Directory doesn't exist, create it
    await Bun.$`mkdir -p ${configPath}`;
  }
}

/**
 * Save credentials to secure storage
 * - macOS: Uses Keychain via Bun.secrets
 * - Other platforms: Uses XDG config directory (~/.config/af/credentials.json)
 */
export async function saveCredentials(
  token: string,
  clientId?: string,
  expiryTimestamp?: number
): Promise<void> {
  const finalClientId = clientId || crypto.randomUUID();
  const finalExpiryTimestamp = expiryTimestamp || Date.now() + 24 * 60 * 60 * 1000;

  const credentials: Credentials = {
    token,
    clientId: finalClientId,
    expiryTimestamp: finalExpiryTimestamp,
  };

  if (isPlatformMacOS()) {
    await Bun.secrets.set({ service: "af", name: "token", value: credentials.token });
    await Bun.secrets.set({ service: "af", name: "clientId", value: credentials.clientId });
    await Bun.secrets.set({
      service: "af",
      name: "expiryTimestamp",
      value: credentials.expiryTimestamp.toString(),
    });
  } else {
    await ensureXDGDirectory();
    const credentialsPath = getXDGCredentialsPath();
    await Bun.write(credentialsPath, JSON.stringify(credentials, null, 2));
  }
}

/**
 * Load credentials from secure storage
 * Returns null if credentials not found
 */
export async function loadCredentials(): Promise<Credentials | null> {
  if (isPlatformMacOS()) {
    const token = await Bun.secrets.get({ service: "af", name: "token" });
    const clientId = await Bun.secrets.get({ service: "af", name: "clientId" });
    const expiryTimestampStr = await Bun.secrets.get({
      service: "af",
      name: "expiryTimestamp",
    });

    if (!token || !clientId || !expiryTimestampStr) {
      return null;
    }

    return {
      token,
      clientId,
      expiryTimestamp: parseInt(expiryTimestampStr, 10),
    };
  } else {
    const credentialsPath = getXDGCredentialsPath();
    const credentialsFile = Bun.file(credentialsPath);

    if (!(await credentialsFile.exists())) {
      return null;
    }

    try {
      const credentials = (await credentialsFile.json()) as Credentials;
      return credentials;
    } catch {
      return null;
    }
  }
}

/**
 * Clear credentials from secure storage
 */
export async function clearCredentials(): Promise<void> {
  if (isPlatformMacOS()) {
    try {
      Bun.secrets.delete({ service: "af", name: "token" });
    } catch {
      // Ignore if key doesn't exist
    }
    try {
      Bun.secrets.delete({ service: "af", name: "clientId" });
    } catch {
      // Ignore if key doesn't exist
    }
    try {
      Bun.secrets.delete({ service: "af", name: "expiryTimestamp" });
    } catch {
      // Ignore if key doesn't exist
    }
  } else {
    const credentialsPath = getXDGCredentialsPath();
    const credentialsFile = Bun.file(credentialsPath);

    if (await credentialsFile.exists()) {
      await Bun.$`rm ${credentialsPath}`;
    }
  }
}
