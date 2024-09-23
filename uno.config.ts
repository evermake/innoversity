import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      collections: {
        iv: {
          moodle: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 128 128"><radialGradient id="deviconMoodle0" cx="532.855" cy="-537.557" r="209.76" gradientTransform="matrix(1 0 0 -1 -297.6 -460.9)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FAAF40"/><stop offset=".043" stop-color="#F9A538"/><stop offset=".112" stop-color="#F89D31"/><stop offset=".227" stop-color="#F89A2F"/><stop offset=".528" stop-color="#F7922D"/><stop offset="1" stop-color="#F37B28"/></radialGradient><path fill="url(#deviconMoodle0)" d="M106.259 105.754V66.975c0-8.164-3.397-12.244-10.034-12.244c-6.629 0-10.034 4.08-10.034 12.244v38.779H66.294V66.975c0-8.164-3.228-12.244-9.862-12.244c-6.633 0-10.036 4.08-10.036 12.244v38.779H26.667V64.768c0-8.504 2.891-14.801 8.844-19.223c5.102-3.91 12.246-5.777 20.92-5.777c9.015 0 15.478 2.207 19.727 6.801c3.57-4.594 10.207-6.801 19.897-6.801c8.844 0 15.819 1.867 20.922 5.777c5.951 4.422 8.843 10.719 8.843 19.223v41.152h-19.563v-.166z"/><path fill="#58595B" d="m28.539 49.627l-2.041 10.207c18.708 6.291 36.395.166 45.751-16.158c-13.778-9.522-26.535.17-43.71 5.951"/><linearGradient id="deviconMoodle1" x1="324.268" x2="368.932" y1="-509.952" y2="-509.952" gradientTransform="matrix(1 0 0 -1 -297.6 -460.9)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#929497"/><stop offset=".124" stop-color="#757578"/><stop offset=".279" stop-color="#575658"/><stop offset=".44" stop-color="#403E3F"/><stop offset=".609" stop-color="#302D2E"/><stop offset=".788" stop-color="#262223"/><stop offset="1" stop-color="#231F20"/></linearGradient><path fill="url(#deviconMoodle1)" d="M28.539 47.08c-.681 3.91-1.192 7.65-1.872 11.563c17.857 6.125 35.375.85 44.73-15.137c-11.909-13.776-25.17-2.383-42.858 3.574"/><linearGradient id="deviconMoodle2" x1="332.834" x2="351.377" y1="-495.051" y2="-521.534" gradientTransform="matrix(1 0 0 -1 -297.6 -460.9)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#231F20"/><stop offset="1" stop-color="#231F20" stop-opacity="0"/></linearGradient><path fill="url(#deviconMoodle2)" d="M49.799 51.668c-8.164-1.701-17.009 2.555-23.131 6.975c-3.912-28.57 13.777-27.893 36.903-20.75c-1.529 6.975-4.083 16.33-8.502 21.941c-.169-3.744-1.869-6.293-5.27-8.166"/><linearGradient id="deviconMoodle3" x1="299.778" x2="381.412" y1="-495.802" y2="-495.802" gradientTransform="matrix(1 0 0 -1 -297.6 -460.9)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#929497"/><stop offset=".124" stop-color="#757578"/><stop offset=".279" stop-color="#575658"/><stop offset=".44" stop-color="#403E3F"/><stop offset=".609" stop-color="#302D2E"/><stop offset=".788" stop-color="#262223"/><stop offset="1" stop-color="#231F20"/></linearGradient><path fill="url(#deviconMoodle3)" d="M2.178 47.08c29.932-18.031 46.77-21.43 81.634-25c-40.478 31.969-41.499 25-81.634 25"/><path fill="none" stroke="#4A4A4C" stroke-width=".5" d="M83.812 22.246L51.667 45.545"/><path fill="#231F20" d="M45.545 34.66c.34 3.744-.511-3.572 0 0" opacity=".23"/><path fill="none" stroke="#A8ABAD" stroke-width=".5" d="m2.178 47.08l49.489-1.535"/><path fill="none" stroke="#F16922" stroke-width=".5" d="M42.484 35.002C33.98 37.383 6.09 43.506 5.747 47.08c-.849 6.631-.167 17.176-.167 17.176"/><path fill="#F16922" d="M8.131 89.596c-3.063-7.652-6.804-16.158-2.384-26.703C8.64 72.756 8.131 80.24 8.131 89.596"/><path fill="#6D6E70" d="M41.076 33.844c.708-.25 1.384-.17 1.509.184c.126.355-.344.846-1.052 1.096c-.709.256-1.384.172-1.51-.184c-.127-.352.344-.844 1.053-1.096"/></svg>`,
          iu: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M43.835 7V43.831H39.5813V7H25.4162V57.9945H58V7H43.835Z" fill="#40BA21"/><path d="M21.1677 25.4168H7V58H21.1677V25.4168Z" fill="#40BA21"/><path d="M7 7H21.1677V21.1661H7V7Z" fill="#40BA21"/></svg>`,
        },
      },
      customizations: {
        iconCustomizer(collection, _, props) {
          if (collection === 'iv') {
            props.width = '1em'
            props.height = '1em'
          }
        },
      },
    }),
  ],

  // https://github.com/unocss/unocss/tree/main/packages/preset-mini/src/_theme
  extendTheme: (theme: any) => {
    theme.colors.gray = theme.colors.neutral
  },

  transformers: [
    transformerDirectives(),
  ],
})
