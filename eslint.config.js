// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: true,
    formatters: true,
    unocss: true,
    vue: true,
    ignores: [
      'src/api/room-booking/index.d.ts',
      'design/*.json',
    ],
  },
  {
    rules: {
      'ts/consistent-type-definitions': 'off',
    },
  },
)
