import assign from 'object-assign'

export const merge = (a, b) => {
  let result = assign({}, a, b)
  for (const key in a) {
    if (!a[key] || typeof b[key] !== 'object') continue
    assign(result, {
      [key]: assign(a[key], b[key]),
    })
  }
  return result
}

// sort object-value responsive styles
const sort = (obj) => {
  const next = {}
  Object.keys(obj)
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    )
    .forEach((key) => {
      next[key] = obj[key]
    })
  return next
}

const defaults = {
  breakpoints: [40, 52, 64].map((n) => n + 'em'),
  modifierSelectors: {
    _hover: '&:hover',
    _focus: '&:focus',
    _focusWithin: '&:focus-within',
    _active: '&:active',
    _visited: '&:visited',
    _disabled: '&:disabled, &:disabled:focus, &:disabled:hover',
    _first: '&:first-of-type',
    _last: '&:last-of-type',
    _even: '&:nth-of-type(even)',
    _odd: '&:nth-of-type(odd)',
    _readOnly: '&[readonly]',
  },
}
const createMediaQuery = (n) => `@media screen and (min-width: ${n})`
const getValue = (n, scale) => get(scale, n, n)

export const get = (obj, key, def, p, undef) => {
  key = key && key.split ? key.split('.') : [key]
  for (p = 0; p < key.length; p++) {
    obj = obj ? obj[key[p]] : undef
  }
  return obj === undef ? def : obj
}

export const createParser = (
  config,
  modifierSelectors = defaults.modifierSelectors
) => {
  const cache = {}
  const parse = (props) => {
    let styles = {}
    let shouldSort = false
    const isCacheDisabled = props.theme && props.theme.disableStyledSystemCache

    cache.breakpoints =
      (!isCacheDisabled && cache.breakpoints) ||
      get(props.theme, 'breakpoints', defaults.breakpoints)

    const loop = (_props, _key) => {
      const sx = config[_key]
      const raw = _props[_key]
      const scale = get(props.theme, sx.scale, sx.defaults)

      if (typeof raw === 'object') {
        if (Array.isArray(raw)) {
          cache.media = (!isCacheDisabled && cache.media) || [
            null,
            ...cache.breakpoints.map(createMediaQuery),
          ]

          return parseResponsiveStyle(cache.media, sx, scale, raw, _props)
        }

        if (raw !== null) {
          shouldSort = true
          return parseResponsiveObject(
            cache.breakpoints,
            sx,
            scale,
            raw,
            _props
          )
        }
      }

      return sx(raw, scale, props)
    }

    for (const key in props) {
      if (modifierSelectors[key]) {
        const pseudoSelector = modifierSelectors[key]
        const pseudoStyles = props[key]
        for (const _key in pseudoStyles) {
          styles[pseudoSelector] = merge(
            styles[pseudoSelector],
            loop(pseudoStyles, _key)
          )

          // sort object-based responsive styles
          if (shouldSort) {
            styles[PSEUDO_SELECTORS[key]] = sort(styles[PSEUDO_SELECTORS[key]])
            shouldSort = false
          }
        }
        continue
      }

      if (!config[key]) continue

      styles = merge(styles, loop(props, key))
    }

    // sort object-based responsive styles
    if (shouldSort) {
      styles = sort(styles)
    }

    return styles
  }
  parse.config = config
  parse.propNames = Object.keys(config)
  parse.cache = cache

  const keys = Object.keys(config).filter((k) => k !== 'config')
  if (keys.length > 1) {
    keys.forEach((key) => {
      parse[key] = createParser({ [key]: config[key] })
    })
  }

  return parse
}

const parseResponsiveStyle = (mediaQueries, sx, scale, raw, props) => {
  let styles = {}
  raw.slice(0, mediaQueries.length).forEach((value, i) => {
    const media = mediaQueries[i]
    const style = sx(value, scale, props)
    if (!media) {
      assign(styles, style)
    } else {
      assign(styles, {
        [media]: assign({}, styles[media], style),
      })
    }
  })
  return styles
}

const parseResponsiveObject = (breakpoints, sx, scale, raw, props) => {
  let styles = {}
  for (let key in raw) {
    const breakpoint = breakpoints[key]
    const value = raw[key]
    const style = sx(value, scale, props)
    if (!breakpoint) {
      assign(styles, style)
    } else {
      const media = createMediaQuery(breakpoint)
      assign(styles, {
        [media]: assign({}, styles[media], style),
      })
    }
  }
  return styles
}

export const createStyleFunction = ({
  properties,
  property,
  scale,
  transform = getValue,
  defaultScale,
}) => {
  properties = properties || [property]
  const sx = (value, scale, props) => {
    const result = {}
    const n = transform(value, scale, props)
    if (n === null) return
    properties.forEach((prop) => {
      result[prop] = n
    })
    return result
  }
  sx.scale = scale
  sx.defaults = defaultScale
  return sx
}

// new v5 API
export const system = (args = {}, modifiers = defaults.modifierSelectors) => {
  const config = {}
  Object.keys(args).forEach((key) => {
    const conf = args[key]
    if (conf === true) {
      // shortcut definition
      config[key] = createStyleFunction({
        property: key,
        scale: key,
      })
      return
    }
    if (typeof conf === 'function') {
      config[key] = conf
      return
    }
    config[key] = createStyleFunction(conf)
  })

  const parser = createParser(config, modifiers)
  return parser
}

export const compose = (...parsers) => {
  let config = {}
  parsers.forEach((parser) => {
    if (!parser || !parser.config) return
    assign(config, parser.config)
  })
  const parser = createParser(config)

  return parser
}
