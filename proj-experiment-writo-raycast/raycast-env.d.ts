/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** AI Backend - Choose between local Ollama (free/offline) or cloud API */
  "provider": "ollama" | "openai" | "gemini",
  /** Ollama Host URL - URL of your local Ollama server */
  "ollamaHost": string,
  /** Ollama Model - Model tag in Ollama (e.g. llama3.1:8b, llama3.2, mistral) */
  "ollamaModel": string,
  /** API Key - API Key if using OpenAI or Gemini */
  "apiKey"?: string,
  /** Custom API Endpoint - Base URL for OpenAI-compatible endpoint (optional) */
  "apiEndpoint": string,
  /** Cloud Model Name - e.g. gpt-4o-mini, gemini-1.5-flash */
  "cloudModel": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `quick-improve` command */
  export type QuickImprove = ExtensionPreferences & {}
  /** Preferences accessible in the `rewrite-palette` command */
  export type RewritePalette = ExtensionPreferences & {}
  /** Preferences accessible in the `scratchpad` command */
  export type Scratchpad = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `quick-improve` command */
  export type QuickImprove = {}
  /** Arguments passed to the `rewrite-palette` command */
  export type RewritePalette = {}
  /** Arguments passed to the `scratchpad` command */
  export type Scratchpad = {}
}

