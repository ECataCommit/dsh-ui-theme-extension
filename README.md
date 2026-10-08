# dsh-ui-theme-extension

An installable dsh Web plug-in that registers an alternative palette through the client theme service. It ships a Catppuccin Mocha theme on top of the default token sheet; the base `theme.css` supplies both color schemes for every active token, and the selected theme file overlays it per token and mode.

## Install

The package is a dsh **bundle**. `package.json` declares `dsh.bundle` (the `cordis.patch.yml` layer that inserts the Loader row) and `dsh.client` (the browser half the Web client serves under `/plugins`). Add the repository in the GUI, or from the CLI:

```sh
dsh plugin --profile web add https://github.com/ECataCommit/dsh-ui-theme-extension
```

Installing needs no `allowBuilds` entry and no build step. pnpm prepares a git-hosted dependency from source only when the manifest's `main` entry is absent from the fetched tree, so committing `lib/index.js` makes pnpm skip that preparation. `lib/client.js` and `lib/types/**/*.d.ts` are committed for the same reason: the installed package resolves its entries from them.

The `@deepseek-ai/dsh-client-ui-theme` peer range (`^0.2.0-rc.2`) is what app-boot's compatibility preflight checks against the running dsh version, not against the installed theme package. Widen it only for runtimes whose theme service and client module protocol you have verified.

Rebuilding those artifacts needs a dsh checkout, because `tsconfig.client.json` references `../vendor/cordis` and `../packages/client/ui-theme/tsconfig.client.json` and the `build` script uses `../node_modules/.bin`. Run `pnpm --dir ui-theme-extension run build` inside the checkout and commit the result. The [release tarball](https://github.com/ECataCommit/dsh-ui-theme-extension/releases/latest) carries the same files for release-based installs:

```sh
dsh plugin --profile web add https://github.com/ECataCommit/dsh-ui-theme-extension/releases/download/v0.1.1/dsh-ui-theme-extension-0.1.1.tgz
```

`dsh plugin --profile <name> add <spec>` forwards to pnpm inside `$DSH_HOME/profiles/<name>`, and because the installed manifest declares `dsh.bundle`, the launcher appends `dsh-ui-theme-extension` to that profile's `dsh.profile.bundles` and applies its patch layer. Use `dsh plugin ...` with an installed CLI and `pnpm dsh plugin ...` from this checkout.

Restart the Web process after installing, for example `pnpm dsh web`: the launcher reads the profile at startup, so a running server keeps serving the previous composition.

Both the repository and the tarball carry the built artifacts (`lib/index.js`, `lib/client.js`, `lib/types/**/*.d.ts`) beside the sources. The tarball is produced by `pnpm --dir ui-theme-extension pack`, whose `prepack` builds from source first. A git install runs no lifecycle script, so nothing in the installed profile needs an `allowBuilds` entry.

## Verify

```sh
pnpm dsh --profile web --dump-config | grep -A2 ui-theme-extension
```

The dump carries a `# == dsh-ui-theme-extension` layer holding the `id: ui-theme-extension` row. After the restart, the served page's `window.__DSH_BOOT__` lists an entry named `dsh-ui-theme-extension`, and `GET /plugins/??dsh-ui-theme-extension/client.js` returns the built palette.

## Uninstall

```sh
pnpm dsh plugin --profile web remove dsh-ui-theme-extension
```

This drops the dependency and the bundle layer; the registered palette disappears on the next restart.

## Development

Install the checkout itself (`pnpm add` records a directory as a link) so a rebuild and restart pick up every edit without repacking:

```sh
pnpm --dir ui-theme-extension run build
pnpm dsh plugin --profile web add ./ui-theme-extension
```

Run `pnpm --dir ui-theme-extension run build` again after editing the Client entry or a stylesheet, then restart the Web process. A `pnpm run dev:web` session additionally hot-reloads changed client bundles.

The build resolves its TypeScript inputs through this checkout: `tsconfig.client.json` references `../vendor/cordis` and `../packages/client/ui-theme/tsconfig.client.json`, and the scripts use `../node_modules/.bin`. Build inside a dsh checkout; distribute the tarball rather than the sources.

## How it works

The Host entry (`src/index.ts`) is an empty Cordis plugin: its only job is to be the Loader row the client module scan resolves to this package manifest.

The Client entry (`src/client/index.ts`) injects the `theme` service, reads the custom properties from the `body` and `body[data-ds-dark-theme]` rules of the imported CSS, and passes each light/dark pair to `ctx.theme.overrideTokens()`. `system` follows the operating system through the theme service. The base `theme.css` supplies both modes for every active token; a selected theme may omit either mode to inherit the base value, while a token absent from the base requires both values. Blanket CSS selectors and `!important` are rejected. The returned disposer removes the override when the plugin unloads.

## Choose a theme

The active theme file is `src/client/themes/catppuccin-mocha.css`: its light rule inherits `theme.css` and its dark rule applies the [official Catppuccin Mocha palette](https://github.com/catppuccin/palette) with mauve accents. Component surface assignments and translucent mixtures are Harness adaptations. Each file in `src/client/themes/` follows the base file's grouping and token order with two palette rules; change the CSS import in the Client entry to select a file, then rebuild and restart.

## Token rules

`theme.css` lists the default global tokens from the theme service's stylesheets, including palette, typography, motion, geometry, shadows, scrollbars, onboarding, and syntax highlighting. Only color and palette values are active; typography, motion, dimensions, blur, and shadow geometry remain commented examples. Scheme-invariant values repeat in both rules, and CSS references and font-size calculations remain intact. Platform-dependent menu fill, browser-dependent corner curvature, focus-state color, and per-element elevation declarations are commented examples so their original conditional rules and local variable resolution remain effective; the dark menu-material stroke color is documented beside the dark defaults.

The Client entry parses `theme.css` first and overlays the selected theme per token and mode. Missing values use the base palette; invalid CSS rules or incomplete new tokens throw instead of silently hiding errors.

## License

MIT. The bundled token lists are derived from the MIT-licensed `@deepseek-ai/dsh-client-ui-theme` package.
