import { defineCommand } from "citty";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { scanBrowsers } from "../lib/auth/extract-token";
import { saveCredentials, loadCredentials, clearCredentials } from "../lib/auth/storage";

/**
 * Show authentication status
 */
async function showStatus(): Promise<void> {
  const credentials = await loadCredentials();

  if (!credentials) {
    console.log("Not authenticated");
    console.log("Run 'af auth' to login");
    return;
  }

  const tokenPreview = credentials.token.slice(0, 20) + "...";
  const expiryDate = new Date(credentials.expiryTimestamp);
  const isExpired = Date.now() > credentials.expiryTimestamp;
  const expiryStatus = isExpired ? "EXPIRED" : "valid";

  console.log(`Status: ${expiryStatus}`);
  console.log(`Token: ${tokenPreview}`);
  console.log(`Client ID: ${credentials.clientId}`);
  console.log(`Expires: ${expiryDate.toISOString()}`);

  if (isExpired) {
    console.log("\n⚠ Token has expired. Run 'af auth refresh' to refresh it.");
  }
}

/**
 * Interactive auth flow
 */
async function interactiveAuth(): Promise<void> {
  console.log("Scanning browsers for Akiflow tokens...");

  const tokens = await scanBrowsers();

  if (tokens.length === 0) {
    console.log("\n❌ No Akiflow tokens found in any browser");
    console.log("\nTo authenticate:");
    console.log("1. Log in to https://web.akiflow.com in your browser");
    console.log("2. Run 'af auth' again to extract your session token");
    process.exit(1);
  }

  console.log(`\nFound ${tokens.length} token(s) from:`);
  console.log(tokens.map((t, i) => `${i + 1}. ${t.browser}`).join("\n"));

  let selectedIndex: number | undefined;

  if (tokens.length === 1) {
    console.log("\nUsing the only available token...");
    selectedIndex = 0;
  } else {
    const rl = createInterface({ input, output });

    try {
      const answer = await rl.question(
        "\nSelect token to use (1-" + tokens.length + "): "
      );
      const parsed = parseInt(answer, 10);

      if (isNaN(parsed) || parsed < 1 || parsed > tokens.length) {
        console.error(`❌ Invalid selection. Please enter a number between 1 and ${tokens.length}`);
        process.exit(1);
      }

      selectedIndex = parsed - 1;
    } finally {
      rl.close();
    }
  }

  if (selectedIndex === undefined) {
    process.exit(1);
  }

  const selected = tokens[selectedIndex]!;
  const tokenPreview = selected.token.slice(0, 20) + "...";

  console.log(`\nSelected: ${selected.browser}`);
  console.log(`Token preview: ${tokenPreview}`);

  await saveCredentials(selected.token);

  console.log("\n✓ Authentication successful!");
  console.log("You can now use af commands like 'af ls' and 'af add'");
}

/**
 * Refresh authentication (force new token extraction)
 */
async function refreshAuth(): Promise<void> {
  console.log("Refreshing authentication...");

  const credentials = await loadCredentials();
  if (credentials) {
    console.log("Clearing existing credentials...");
    await clearCredentials();
  }

  await interactiveAuth();
}

/**
 * Logout (clear stored credentials)
 */
async function logoutAuth(): Promise<void> {
  const credentials = await loadCredentials();

  if (!credentials) {
    console.log("Not authenticated. Nothing to logout.");
    return;
  }

  console.log("Clearing stored credentials...");
  await clearCredentials();

  console.log("✓ Logged out successfully");
}

/**
 * Main auth command (interactive flow)
 */
export const authCommand = defineCommand({
  meta: {
    name: "auth",
    description: "Manage Akiflow authentication",
  },
  subCommands: {
    status: defineCommand({
      meta: {
        name: "status",
        description: "Show current authentication status",
      },
      run: async () => {
        await showStatus();
      },
    }),
    logout: defineCommand({
      meta: {
        name: "logout",
        description: "Clear stored credentials",
      },
      run: async () => {
        await logoutAuth();
      },
    }),
    refresh: defineCommand({
      meta: {
        name: "refresh",
        description: "Force refresh of authentication token",
      },
      run: async () => {
        await refreshAuth();
      },
    }),
  },
  run: async () => {
    await interactiveAuth();
  },
});
