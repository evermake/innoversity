import type {
  Color,
  EffectDropShadow,
  EffectInnerShadow,
  ExportResultEffectStyles,
  ExportResultVariables,
} from 'figma-export-values'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const to = (p: string) => path.join(__dirname, p)

const VARIABLES_JSON = to('../design/variables.json')
const EFFECT_STYLES_JSON = to('../design/effect-styles.json')
const COLORS_SASS = to('../src/assets/css/_colors.scss')
const EFFECTS_SASS = to('../src/assets/css/_effects.scss')
const BORDERS_SASS = to('../src/assets/css/_borders.scss')

async function main() {
  const variablesData = JSON.parse(await fs.readFile(VARIABLES_JSON, 'utf-8')) as ExportResultVariables

  //////////////////////////////////////////////////////////////////////////////

  const colorsCollection = variablesData.collections.find(({ name }) => name === 'Colors')!

  const colorsSass = [
    '/* GENERATED */',
    '',
    ...colorsCollection
      .variables
      .filter(({ type }) => type === 'color')
      .map(({ name, values }) => ({
        name,
        value: figmaColorToRgba(values[colorsCollection.defaultModeId] as Color),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name, value }) => `$${name}: ${value};`),
    '',
  ].join('\n')

  await fs.writeFile(COLORS_SASS, colorsSass)

  //////////////////////////////////////////////////////////////////////////////

  const bordersCollection = variablesData.collections.find(({ name }) => name === 'Borders')!

  const bordersSass = [
    '/* GENERATED */',
    '',
    ...bordersCollection
      .variables
      .filter(({ type }) => type === 'float')
      .map(({ name, values }) => ({
        name,
        value: Math.round(values[bordersCollection.defaultModeId] as number),
      }))
      .map(({ name, value }) => `\$${name}: ${value}px;`),
    '',
  ].join('\n')

  await fs.writeFile(BORDERS_SASS, bordersSass)

  //////////////////////////////////////////////////////////////////////////////

  const effectsData = JSON.parse(await fs.readFile(EFFECT_STYLES_JSON, 'utf-8')) as ExportResultEffectStyles

  const effectsSass = [
    '/* GENERATED */',
    '',
    ...effectsData
      .styles
      .flatMap(({ name, effects }) => {
        const decls: Record<'backdrop-filter' | 'filter' | 'box-shadow', string[]> = {
          'backdrop-filter': [],
          'filter': [],
          'box-shadow': [],
        }

        for (const effect of effects.filter(e => e.visible)) {
          switch (effect.type) {
            case 'LAYER_BLUR':
              decls.filter.push(`blur(${effect.radius}px)`)
              break
            case 'BACKGROUND_BLUR':
              decls['backdrop-filter'].push(`blur(${effect.radius}px)`)
              break
            case 'DROP_SHADOW':
            case 'INNER_SHADOW':
              decls['box-shadow'].push(shadowEffectToCssBoxShadowValue(effect))
              break
            default: effect satisfies never
          }
        }

        return [
          `@mixin ${name} {`,
          ...Object
            .entries(decls)
            .filter(([,values]) => values.length > 0)
            .map(([prop, values]) => `  ${prop}: ${values.join(', ')};`),
          '}',
          '',
        ]
      }),
  ].join('\n')

  await fs.writeFile(EFFECTS_SASS, effectsSass)

  //////////////////////////////////////////////////////////////////////////////
}

function figmaColorToRgba(color: Color): string {
  const r = Math.round(scale(color.r, 0, 1, 0, 255))
  const g = Math.round(scale(color.g, 0, 1, 0, 255))
  const b = Math.round(scale(color.b, 0, 1, 0, 255))
  if (color.a != null) {
    const a = Math.round(scale(color.a, 0, 1, 0, 100))
    return `rgba(${r}, ${g}, ${b}, ${a}%)`
  }
  return `rgb(${r}, ${g}, ${b})`
}

function scale(n: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return (n - inMin) / (inMax - inMin) * (outMax - outMin) + outMin
}

function shadowEffectToCssBoxShadowValue(effect: EffectDropShadow | EffectInnerShadow) {
  return [
    effect.type === 'INNER_SHADOW' ? 'inset' : '',
    `${effect.offset.x}px`,
    `${effect.offset.y}px`,
    `${effect.radius}px`,
    `${effect.spread ?? 0}px`,
    figmaColorToRgba(effect.color),
  ].filter(Boolean).join(' ')
}

await main()
