/*
 * Copyright (C) OokTech LLC 2017
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Written by Jedediah and Joshua Carty <ook@ooktech.com>
 *
 * Description: Determines which configuration and then exposes it as an
 * object. Configurations are created by a tool but can be hand edited if need
 * be.
 *
 * There is a default configuration file "Config.json" that shouldn't every be
 * edited. This file is the base configuration. To add custom settings the file
 * Local.json is used. Each property of Local.json in copied into the
 * configuration object returned here and in case of conflicts the version from
 * Local.json is used.
 *
 * Note that the parser is extremely strict as to what is a valid JSON file
 * (beware extra commas!).
 */

var fs = require('fs')

// Start with known default file.
const defaultConfig = './config/Config.json'
// The default path to the local configuration file. This can be overridden by
// process.argv[2] (the second command line parameter used)
const defaultLocalConfig = './config/Local.json'

// Initialise an empty object for the local configuration.
var LocalConfig = {}

/*
  Load the default configuration and modify it with anything from the local
  configuration and return the result.
*/
var loadConfiguration = function () {
  // If path argument exists, use it. Otherwise fall back to defaultConfig.
  var configPath = defaultConfig
  var rawConfig
  var config

  // Nested try/catch in case user defined path is invalid.
  try {
    rawConfig = fs.readFileSync(configPath)
  } catch (err) {
    // Try default fallback next.
    console.log('failed to load default config.')
    try {
      rawConfig = fs.readFileSync(defaultConfig)
    } catch (err) {
      // Failed to load default as well.
    }
  }

  // Try to parse the JSON after loading the file.
  try {
    config = JSON.parse(rawConfig)
  } catch (err) {
    console.log("Error: ", err)
    // Create an empty default configuration.
    config = {
      'Components': {}
    }
  }

  // We need to load the local configuration that may be different from the
  // global defaults. The local configuration is preferentially used over the
  // global defaults.
  var localConfigPath = process.argv[2] ? process.argv[2] : defaultLocalConfig
  var rawLocalConfig

  try {
    rawLocalConfig = fs.readFileSync(localConfigPath)
  } catch (e) {
    // If failure return an empty json object
    rawLocalConfig = {}
    console.log('failed to load local config')
  }

  try {
    // Try parsing the local config json file
    LocalConfig = JSON.parse(rawLocalConfig)
    updateConfig(config, LocalConfig)
  } catch (e) {
    // If we can't parse it what do we do?
    console.log('failed to parse local config')
  }
  return config
}

/*
  given a local and a global config, this returns the global config but with
  any properties that are also in the local config changed to the values given
  in the local config.
  Changes to the configuration are later saved to the local config.
*/
var updateConfig = function (globalConfig, localConfig) {
  console.log(globalConfig)
  // Walk though the properties in the localConfig, for each property set the
  // global config equal to it, but only for singleton properties. Don't set
  // something like GlobalConfig.Accelerometer = localConfig.Accelerometer, set
  // globalConfig.Accelerometer.Controller =
  // localConfig.Accelerometer.Contorller
  Object.keys(localConfig).forEach(function (key, index) {
    console.log(key)
    console.log(index)
    if (typeof localConfig[key] === 'object') {
      if (!globalConfig[key]) {
        globalConfig[key] = {}
      }
      // do this again!
      updateConfig(globalConfig[key], localConfig[key])
    } else {
      globalConfig[key] = localConfig[key]
    }
  })
}

// Returns the parsed configuration.
var Configuration = loadConfiguration()

module.exports = Configuration
module.exports.Local = LocalConfig
