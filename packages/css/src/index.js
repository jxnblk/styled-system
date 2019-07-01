// based on https://github.com/developit/dlv
export const get = (obj, key, def, p, undef) => {
  key = key && key.split ? key.split('.') : [key]
  for (p = 0; p < key.length; p++) {
    obj = obj ? obj[key[p]] : undef
  }
  return obj === undef ? def : obj
}

const defaultBreakpoints = [40, 52, 64].map(n => n + 'em')

const defaultTheme = {
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 72],
}

const aliases = {
  bg: 'backgroundColor',
  m: 'margin',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mx: 'marginX',
  my: 'marginY',
  p: 'padding',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  px: 'paddingX',
  py: 'paddingY',
}

const directions = {
  marginX: ['marginLeft', 'marginRight'],
  marginY: ['marginTop', 'marginBottom'],
  paddingX: ['paddingLeft', 'paddingRight'],
  paddingY: ['paddingTop', 'paddingBottom'],
}

const scales = {
  color: 'colors',
  backgroundColor: 'colors',
  borderColor: 'colors',
  margin: 'space',
  marginTop: 'space',
  marginRight: 'space',
  marginBottom: 'space',
  marginLeft: 'space',
  marginX: 'space',
  marginY: 'space',
  padding: 'space',
  paddingTop: 'space',
  paddingRight: 'space',
  paddingBottom: 'space',
  paddingLeft: 'space',
  paddingX: 'space',
  paddingY: 'space',
  top: 'space',
  right: 'space',
  bottom: 'space',
  left: 'space',
  gridGap: 'space',
  gridColumnGap: 'space',
  gridRowGap: 'space',
  fontFamily: 'fonts',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights',
  lineHeight: 'lineHeights',
  letterSpacing: 'letterSpacings',
  border: 'borders',
  borderTop: 'borders',
  borderRight: 'borders',
  borderBottom: 'borders',
  borderLeft: 'borders',
  borderWidth: 'borderWidths',
  borderStyle: 'borderStyles',
  borderRadius: 'radii',
  borderTopRightRadius: 'radii',
  borderTopLeftRadius: 'radii',
  borderBottomRightRadius: 'radii',
  borderBottomLeftRadius: 'radii',
  boxShadow: 'shadows',
  textShadow: 'shadows',
  zIndex: 'zIndices',
  width: 'sizes',
  minWidth: 'sizes',
  maxWidth: 'sizes',
  height: 'sizes',
  minHeight: 'sizes',
  maxHeight: 'sizes',
}

const positiveOrNegative = (scale, value) => {
  if (typeof value !== 'number' || value >= 0) {
    return get(scale, value, value)
  }
  const absolute = Math.abs(value)
  const n = get(scale, absolute, absolute)
  if (typeof n === 'string') return '-' + n
  return n * -1
}

const transforms = [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginX',
  'marginY',
  'top',
  'bottom',
  'left',
  'right',
].reduce(
  (acc, curr) => ({
    ...acc,
    [curr]: positiveOrNegative,
  }),
  {}
)

export const responsive = styles => theme => {
  const next = {}
  const breakpoints = get(theme, 'breakpoints', defaultBreakpoints)
  let mediaQueries
  if(Array.isArray(breakpoints)) {
    mediaQueries = [null, ...breakpoints.map((n) => `@media screen and (min-width: ${n})`)]
  }
  else {
    mediaQueries = {}
    for (const key in breakpoints) {
      mediaQueries[key] = `@media screen and (min-width: ${breakpoints[key]})`
    }
  }

  for (const key in styles) {
    const value = styles[key]
    if (value == null) continue
    if(typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const i in value) {
          const media = mediaQueries[i]
          if (value[i] == null) continue
          if (!media) {
            next[key] = value[i]
            continue
          }
          next[media] = next[media] || {}
          next[media][key] = value[i]
        }
        continue
      }
      else {
        for (const k in value) {
          const media = mediaQueries[k]
          if (value[k] == null) continue
          if(k === '_' && value._) {
            next[key] = value._
            continue
          }
          if (!media) {
            next[key] = value
            continue
          }
          next[media] = next[media] || {}
          next[media][key] = value[k]
        }
        continue
      }
    }
    next[key] = value
  }

  return next
}

export const css = args => (props = {}) => {
  const theme = { ...defaultTheme, ...(props.theme || props) }
  let result = {}
  const obj = typeof args === 'function' ? args(theme) : args
  const styles = responsive(obj)(theme)

  for (const key in styles) {
    const prop = get(aliases, key, key)
    const scaleName = get(scales, prop)
    const scale = get(theme, scaleName, get(theme, prop, {}))
    const x = styles[key]
    const val = typeof x === 'function' ? x(theme) : x
    if (key === 'variant') {
      const variant = css(get(theme, val))(theme)
      result = { ...result, ...variant }
      continue
    }
    if (val && typeof val === 'object') {
      result[prop] = css(val)(theme)
      continue
    }
    const transform = get(transforms, prop, get)
    const value = transform(scale, val, val)
    if (directions[prop]) {
      const dirs = directions[prop]
      for (let i = 0; i < dirs.length; i++) {
        result[dirs[i]] = value
      }
    } else {
      result[prop] = value
    }
  }

  return result
}

export default css
