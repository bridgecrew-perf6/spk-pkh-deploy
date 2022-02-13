function isNoError(obj) {
  for (let k of Object.keys(obj)) {
    if (obj[k]) {
      return true;
    }
  }
  return false;
}

function required({ key }) {
  return v => [!!v , `${key} harus diisi`]
}

function exactLength({ length, key }) {
  return v => [v.length == length , `${key} harus tepat ${length} karakter`]
}

function minLength({ length, key }) {
  return v => [v.length >= length , `${key} harus lebih dari ${length} karakter`]
}

function maxLength({ length, key }) {
  return v => [v.length <= length , `${key} harus kurang dari ${length} karakter`]
}

function minVal({ min, key }) {
  return v => [v > min, `${key} harus lebih besar dari ${min}`]
}

function maxVal({ max, key }) {
  return v => [v < max, `${key} harus lebih kecil dari ${max}`]
}

function regex({ pattern, key }) {
  const compiledPattern = new RegExp(pattern)
  return v => [v.match(compiledPattern), `${key} yang dimasukan sesuai format`]
}

const VALIDATION_GLOBAL_RULES = {
  exactLength,
  required,
  minLength,
  maxLength,
  minVal,
  maxVal,
  regex
}

function validation(obj, rules) {
  let result = {}
  const propKeys = Object.keys(obj)
  for (let k of propKeys) {
    if (!rules[k]) {
      continue
    }
    const targetProp = obj[k]
    const ruleOptions = rules[k]
    const { key, ...restRules } = ruleOptions
    const propRuleKeys = Object.keys(restRules)

    for (let ruleKey of propRuleKeys) {
      if (!VALIDATION_GLOBAL_RULES[ruleKey]) {
        continue;
      }
      const ruleFunc = VALIDATION_GLOBAL_RULES[ruleKey]
      const ruleFuncParam = restRules[ruleKey]

      let isPass = false
      let message = null
      if (ruleFuncParam === true) {
        // No params provided
        [isPass, message] = ruleFunc({ key })(targetProp)
      } else if (ruleFuncParam instanceof Object) {
        // There is our params
        [isPass, message] = ruleFunc({ ...ruleFuncParam, key })(targetProp)
      }

      if (isPass) {
        continue
      } else {
        result[k] = message
        break;
      }
    }
  }
  return result
}