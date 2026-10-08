import type { Context } from '@deepseek-ai/cordis'
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import baseStyles from './theme.css?inline'
import styles from './themes/catppuccin-mocha.css?inline'

function palette(rule: CSSRule, selector: string): Record<string, string> {
  if (!(rule instanceof CSSStyleRule) || rule.selectorText !== selector) {
    throw new Error(`Theme CSS must contain a ${selector} rule`)
  }
  const values: Record<string, string> = {}
  for (let index = 0; index < rule.style.length; index += 1) {
    const name = rule.style.item(index)
    if (!name.startsWith('--') || rule.style.getPropertyPriority(name) !== '') {
      throw new Error(`Theme CSS requires plain custom properties: ${name}`)
    }
    values[name] = rule.style.getPropertyValue(name).trim()
  }
  return values
}

function themeTokens(css: string, fallback: ThemeTokenOverrides = {}): ThemeTokenOverrides {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  if (sheet.cssRules.length !== 2) {
    throw new Error('Theme CSS needs exactly two rules: body and body[data-ds-dark-theme]')
  }
  const light = palette(sheet.cssRules[0]!, 'body')
  const dark = palette(sheet.cssRules[1]!, 'body[data-ds-dark-theme]')
  const names = new Set([...Object.keys(fallback), ...Object.keys(light), ...Object.keys(dark)])
  if (names.size === 0) throw new Error('Theme CSS has no custom properties')
  const tokens: ThemeTokenOverrides = {}
  for (const name of names) {
    const lightValue = light[name] ?? fallback[name]?.light
    const darkValue = dark[name] ?? fallback[name]?.dark
    if (lightValue === undefined) throw new Error(`Theme CSS is missing a light value for ${name}`)
    if (darkValue === undefined) throw new Error(`Theme CSS is missing a dark value for ${name}`)
    tokens[name] = { light: lightValue, dark: darkValue }
  }
  return tokens
}

/** Activate after the browser theme service is available. */
export const inject = ['theme']

/** Register the CSS-authored palette for this plugin's lifetime.
 * @param ctx Browser plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.theme.overrideTokens('dsh-ui-theme-extension', themeTokens(styles, themeTokens(baseStyles))))
}
