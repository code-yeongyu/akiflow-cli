/// <reference types="bun" />
import { describe, it, expect, spyOn } from "bun:test";
import { authCommand } from "../../commands/auth";

describe("auth command", () => {
  describe("command metadata", () => {
    // given
    it("has correct name", () => {
      // then
      expect(authCommand.meta?.name).toBe("auth");
    });

    // given
    it("has correct description", () => {
      // then
      expect(authCommand.meta?.description).toBe("Manage Akiflow authentication");
    });
  });

  describe("subcommands", () => {
    // given
    it("has status subcommand", async () => {
      const subCommands = await authCommand.subCommands;
      // then
      expect(subCommands).toBeDefined();
      if (subCommands && "status" in subCommands) {
        expect(await subCommands.status.meta?.name).toBe("status");
      }
    });

    // given
    it("has logout subcommand", async () => {
      const subCommands = await authCommand.subCommands;
      // then
      expect(subCommands).toBeDefined();
      if (subCommands && "logout" in subCommands) {
        expect(await subCommands.logout.meta?.name).toBe("logout");
      }
    });

    // given
    it("has refresh subcommand", async () => {
      const subCommands = await authCommand.subCommands;
      // then
      expect(subCommands).toBeDefined();
      if (subCommands && "refresh" in subCommands) {
        expect(await subCommands.refresh.meta?.name).toBe("refresh");
      }
    });

    // given
    it("status subcommand has description", async () => {
      const subCommands = await authCommand.subCommands;
      // then
      if (subCommands && "status" in subCommands) {
        expect(await subCommands.status.meta?.description).toBe(
          "Show current authentication status"
        );
      }
    });

    // given
    it("logout subcommand has description", async () => {
      const subCommands = await authCommand.subCommands;
      // then
      if (subCommands && "logout" in subCommands) {
        expect(await subCommands.logout.meta?.description).toBe(
          "Clear stored credentials"
        );
      }
    });

    // given
    it("refresh subcommand has description", async () => {
      const subCommands = await authCommand.subCommands;
      // then
      if (subCommands && "refresh" in subCommands) {
        expect(await subCommands.refresh.meta?.description).toBe(
          "Force refresh of authentication token"
        );
      }
    });
  });

  describe("status subcommand integration", () => {
    // given
    it("shows not authenticated when no credentials", async () => {
      const loadCredentialsSpy = spyOn(
        await import("../../lib/auth/storage"),
        "loadCredentials"
      ).mockResolvedValueOnce(null);
      const consoleLogSpy = spyOn(console, "log");

      const subCommands = await authCommand.subCommands;
      if (subCommands && "status" in subCommands) {
        await subCommands.status.run();
      }

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith("Not authenticated");
      expect(consoleLogSpy).toHaveBeenCalledWith("Run 'af auth' to login");

      loadCredentialsSpy.mockRestore();
    });

    // given
    it("shows authenticated when credentials exist", async () => {
      const mockCredentials = {
        token: "test-token-with-some-length",
        clientId: "test-client-id",
        expiryTimestamp: Date.now() + 3600000,
      };

      const loadCredentialsSpy = spyOn(
        await import("../../lib/auth/storage"),
        "loadCredentials"
      ).mockResolvedValueOnce(mockCredentials);
      const consoleLogSpy = spyOn(console, "log");

      const subCommands = await authCommand.subCommands;
      if (subCommands && "status" in subCommands) {
        await subCommands.status.run();
      }

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Status: valid")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockCredentials.clientId)
      );

      loadCredentialsSpy.mockRestore();
    });
  });

  describe("logout subcommand integration", () => {
    // given
    it("clears credentials when authenticated", async () => {
      const mockCredentials = {
        token: "test-token",
        clientId: "test-client-id",
        expiryTimestamp: Date.now() + 3600000,
      };

      const loadCredentialsSpy = spyOn(
        await import("../../lib/auth/storage"),
        "loadCredentials"
      ).mockResolvedValueOnce(mockCredentials);
      const clearCredentialsSpy = spyOn(
        await import("../../lib/auth/storage"),
        "clearCredentials"
      ).mockResolvedValueOnce(undefined);
      const consoleLogSpy = spyOn(console, "log");

      const subCommands = await authCommand.subCommands;
      if (subCommands && "logout" in subCommands) {
        await subCommands.logout.run();
      }

      // then
      expect(clearCredentialsSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Logged out successfully")
      );

      loadCredentialsSpy.mockRestore();
      clearCredentialsSpy.mockRestore();
    });

    // given
    it("shows message when not authenticated", async () => {
      const loadCredentialsSpy = spyOn(
        await import("../../lib/auth/storage"),
        "loadCredentials"
      ).mockResolvedValueOnce(null);
      const consoleLogSpy = spyOn(console, "log");

      const subCommands = await authCommand.subCommands;
      if (subCommands && "logout" in subCommands) {
        await subCommands.logout.run();
      }

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Not authenticated. Nothing to logout."
      );

      loadCredentialsSpy.mockRestore();
    });
  });

  describe("main auth command integration", () => {
    // given
    it("calls scanBrowsers for token extraction", async () => {
      const scanBrowsersSpy = spyOn(
        await import("../../lib/auth/extract-token"),
        "scanBrowsers"
      ).mockResolvedValueOnce([]);
      const consoleLogSpy = spyOn(console, "log");

      // when
      await authCommand.run();

      // then
      expect(scanBrowsersSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No Akiflow tokens found")
      );

      scanBrowsersSpy.mockRestore();
    });
  });
});
