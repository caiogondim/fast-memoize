const isPrimitive = require('./isPrimitive')

//
// Strategy
//

function strategyDefault (fn, options) {
  function monadic (fn, cache, serializer, arg) {
    const cacheKey = isPrimitive(arg) ? arg : serializer(arg)

    if (!cache.has(cacheKey)) {
      const computedValue = fn.call(this, arg)
      cache.set(cacheKey, computedValue)
      return computedValue
    }

    return cache.get(cacheKey)
  }

  function variadic (fn, cache, serializer, ...args) {
    const cacheKey = serializer(args)

    if (!cache.has(cacheKey)) {
      const computedValue = fn.apply(this, args)
      cache.set(cacheKey, computedValue)
      return computedValue
    }

    return cache.get(cacheKey)
  }

  let memoized = fn.length === 1 ? monadic : variadic

  memoized = memoized.bind(
    this,
    fn,
    options.cache.create(),
    options.serializer
  )

  return memoized
}

//
// Serializer
//

const serializerDefault = (...args) => JSON.stringify(args)

//
// Cache
//

class ObjectWithoutPrototypeCache {
  constructor () {
    this.cache = Object.create(null)
  }

  has (key) {
    return (key in this.cache)
  }

  get (key) {
    return this.cache[key]
  }

  set (key, value) {
    this.cache[key] = value
  }
}

const cacheDefault = {
  create: () => new ObjectWithoutPrototypeCache()
}

//
// export Main
//

const defaults = {
  strategy: strategyDefault,
  serializer: serializerDefault,
  cache: cacheDefault
}

module.exports = function memoize (fn, options) {
  const activeOptions = Object.assign({}, defaults, options)

  return activeOptions.strategy(fn, {
    serializer: activeOptions.serializer,
    cache: activeOptions.cache
  })
}
