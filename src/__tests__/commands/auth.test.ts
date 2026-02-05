/// <reference types="bun" />
import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { authCommand } from "../../commands/auth";
import * as storage from "../../lib/auth/storage";

describe("auth command", () => {
  let consoleLogSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleLogSpy = spyOn(console, "log");
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("command structure", () => {
    it("has meta defined", () => {
      // then
      expect(authCommand.meta).toBeDefined();
    });

    it("has args defined", () => {
      // then
      expect(authCommand.args).toBeDefined();
    });

    it("has run function", () => {
      // then
      expect(authCommand.run).toBeDefined();
      expect(typeof authCommand.run).toBe("function");
    });
  });

  describe("status action", () => {
    it("shows not authenticated when no credentials", async () => {
      // given
      const loadCredentialsSpy = spyOn(storage, "loadCredentials").mockResolvedValueOnce(null);

      // when
      await authCommand.run?.({ args: { action: "status" } } as never);

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith("Not authenticated");
      expect(consoleLogSpy).toHaveBeenCalledWith("Run 'af auth' to login");

      loadCredentialsSpy.mockRestore();
    });

    it("shows authenticated when credentials exist", async () => {
      // given
      const mockCredentials = {
        token: "test-token-with-some-length",
        clientId: "test-client-id",
        expiryTimestamp: Date.now() + 3600000,
      };
      const loadCredentialsSpy = spyOn(storage, "loadCredentials").mockResolvedValueOnce(mockCredentials);

      // when
      await authCommand.run?.({ args: { action: "status" } } as never);

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Status: valid")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockCredentials.clientId)
      );

      loadCredentialsSpy.mockRestore();
    });

    it("shows expired status when token expired", async () => {
      // given
      const mockCredentials = {
        token: "test-token-with-some-length",
        clientId: "test-client-id",
        expiryTimestamp: Date.now() - 3600000, // expired
      };
      const loadCredentialsSpy = spyOn(storage, "loadCredentials").mockResolvedValueOnce(mockCredentials);

      // when
      await authCommand.run?.({ args: { action: "status" } } as never);

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Status: EXPIRED")
      );

      loadCredentialsSpy.mockRestore();
    });
  });

  describe("logout action", () => {
    it("clears credentials when authenticated", async () => {
      // given
      const mockCredentials = {
        token: "test-token",
        clientId: "test-client-id",
        expiryTimestamp: Date.now() + 3600000,
      };
      const loadCredentialsSpy = spyOn(storage, "loadCredentials").mockResolvedValueOnce(mockCredentials);
      const clearCredentialsSpy = spyOn(storage, "clearCredentials").mockResolvedValueOnce(undefined);

      // when
      await authCommand.run?.({ args: { action: "logout" } } as never);

      // then
      expect(clearCredentialsSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Logged out successfully")
      );

      loadCredentialsSpy.mockRestore();
      clearCredentialsSpy.mockRestore();
    });

    it("shows message when not authenticated", async () => {
      // given
      const loadCredentialsSpy = spyOn(storage, "loadCredentials").mockResolvedValueOnce(null);

      // when
      await authCommand.run?.({ args: { action: "logout" } } as never);

      // then
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Not authenticated. Nothing to logout."
      );

      loadCredentialsSpy.mockRestore();
    });
  });

  describe("main auth command (login)", () => {
    it.skipIf(process.platform !== "darwin")("calls scanBrowsers for token extraction", async () => {
      // given
      const scanBrowsersSpy = spyOn(
        await import("../../lib/auth/extract-token"),
        "scanBrowsers"
      ).mockResolvedValueOnce([]);
      const processExitSpy = spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      // when
      try {
        await authCommand.run?.({ args: {} } as never);
      } catch (e) {
        if (!(e instanceof Error && e.message === "process.exit called")) {
          throw e;
        }
      }

      // then
      expect(scanBrowsersSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No Akiflow tokens found")
      );

      scanBrowsersSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
