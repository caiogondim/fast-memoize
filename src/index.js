//
// Main
//

module.exports = function memoize (fn, options) {
  var cache
  var serializer
  var strategy

  if (options && options.cache) {
    cache = options.cache
  } else {
    cache = cacheDefault
  }

  if (options && options.serializer) {
    serializer = options.serializer
  } else {
    serializer = serializerDefault
  }

  if (options && options.strategy) {
    strategy = options.strategy
  } else {
    strategy = strategyDefault
  }

  return strategy(fn, {
    cache,
    serializer
  })
}

//
// Strategy
//

function isPrimitive (value) {
  return value == null || (typeof value !== 'function' && typeof value !== 'object')
}

function strategyDefault (fn, options) {
  function monadic (fn, cache, serializer, arg) {
    var cacheKey
    if (isPrimitive(arg)) {
      cacheKey = arg
    } else {
      cacheKey = serializer(arg)
    }

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    return cache.set(cacheKey, fn.call(this, arg))
  }

  function variadic (fn, cache, serializer, ...args) {
    var cacheKey = serializer(args)

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    return cache.set(cacheKey, fn.apply(this, args))
  }

  var memoized = fn.length === 1
    ? monadic
    : variadic

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

function serializerDefault (...args) {
  return JSON.stringify(args)
}

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
    return this.cache[key] = value
  }

  delete (key) {
    delete this.cache[key]
  }
}

const cacheDefault = {
  create: () => new ObjectWithoutPrototypeCache()
}
