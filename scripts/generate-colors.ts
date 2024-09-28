import type { Color, ExportResultVariables } from 'figma-export-values'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const to = (p: string) => path.join(__dirname, p)

const VARIABLES_JSON = to('../design/variables.json')
const COLORS_SASS = to('../src/assets/css/_colors.scss')

async function main() {
  const variablesData = JSON.parse(await fs.readFile(VARIABLES_JSON, 'utf-8')) as ExportResultVariables
  const collection = variablesData.collections.find(({ name }) => name === 'Colors')!

  const colorVars = collection
    .variables
    .filter(({ type }) => type === 'color')
    .map(({ name, values }) => ({
      name,
      value: figmaColorToRgba(values[collection.defaultModeId] as Color),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (new Set(colorVars.map(({ name }) => name)).size !== colorVars.length)
    throw new Error('Duplicate color variables found')

  const sassContent = [
    '/* GENERATED */',
    '',
    ...colorVars.map(({ name, value }) => `$${name}: ${value};`),
    '',
  ].join('\n')

  await fs.writeFile(COLORS_SASS, sassContent)
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

await main()
