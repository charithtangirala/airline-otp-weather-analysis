const Q = require('Q')
const _ = require('lodash')
const csvParser = require('csv-to-json')

module.exports = {
  parse() {
    const deferred = Q.defer()
    const airportsDataToLoad = csvParser.parse({filename: './data/airline/airports.data'}, (error, json) => {
      if (!error) {
        deferred.resolve(json)
      } else {
        deferred.reject(error)
      }
    })

    return deferred.promise
  },

  getGeoLocations(airports) {
    return _.chain(airports)
          .filter((x) => x.icao !== '' && x.icao !== 'Not Available')
          .map((x) => {return {icao: x.icao, latitude: x.latitude, longitude: x.longitude}})
          .value()
  },

  getGeoLocationsForCountries(airports, countries) {
    const filteredAirports = _.filter(airports, (x) => countries.indexOf(x.country) >= 0)

    return this.getGeoLocations(filteredAirports)
  }
}
