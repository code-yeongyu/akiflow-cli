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
  console.log(`Auto-refresh: ${credentials.refreshToken ? "enabled" : "disabled"}`);

  if (isExpired && credentials.refreshToken) {
    console.log("\n⚠ Token has expired. It will be automatically refreshed on next API call.");
  } else if (isExpired) {
    console.log("\n⚠ Token has expired. Run 'af auth' to re-authenticate.");
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

  const expiryTimestamp = selected.expiresAt?.getTime();
  await saveCredentials(selected.token, undefined, expiryTimestamp, selected.refreshToken);

  console.log("\n✓ Authentication successful!");
  if (selected.refreshToken) {
    console.log("✓ Refresh token saved for automatic token renewal");
  }
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
  args: {
    action: {
      type: "positional",
      description: "Action: status, login, logout, refresh",
      required: false,
    },
  },
  run: async ({ args }) => {
    const action = args.action as string | undefined;

    switch (action) {
      case "status":
        await showStatus();
        break;
      case "logout":
        await logoutAuth();
        break;
      case "refresh":
        await refreshAuth();
        break;
      case "login":
      case undefined:
        await interactiveAuth();
        break;
      default:
        console.log("Unknown action. Use: af auth [status|login|logout|refresh]");
        process.exit(1);
    }
  },
});
