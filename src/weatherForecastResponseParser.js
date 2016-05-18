const _ = require('lodash');

module.exports = {

  //[{timeKey: 'k-p24h-n8-4', timestamps: ['2016-02-17T06:00:00-06:00', ...]}, ...]
  getTimestamps(timestampsFromResponse) {
    return timestampsFromResponse.map((x) => {
      return {
        timeKey: x['layout-key'][0],
        timestamps: x['start-valid-time']
      }
    })
  },

  // [{locationKey: '', latitude: '', longitude: ''}, ...]
  getLocations(locationsFromResponse) {
    return _.map(locationsFromResponse, (locationsFromResponse) => {
      return {
        locationKey: locationsFromResponse['location-key'][0],
        latitude: locationsFromResponse.point[0].$.latitude,
        longitude: locationsFromResponse.point[0].$.longitude
      }
    })
  },

  // [{timestamp: '2016-02-14T04:00:00-08:00', type: 'sustained', units: 'knots', value: '14'}]
  getWindSpeedsForLocations(locations, allTimestamps, parameters) {
    const windSpeeds = []

    _.forEach(parameters, (parameter) => {
      const location = _.find(locations, {'locationKey': parameter.$['applicable-location']})
      const windSpeedsForALocation = parameter['wind-speed']

      _.forEach(windSpeedsForALocation, (windSpeedForALocation) => {
        const timestamps = _.find(allTimestamps, {timeKey: windSpeedForALocation.$['time-layout']}).timestamps
        windSpeeds.push(_.map(windSpeedForALocation.value, (x, index) => {
          return {
            timestamp: timestamps[index],
            type: windSpeedForALocation.$.type,
            units: windSpeedForALocation.$.units,
            value: Number(x),
            location: `${location.latitude}, ${location.longitude}`
          }
        }))
      })
    })
    return _.flatten(windSpeeds)
  },

  getSnowAmounts(locations, allTimestamps, parameters) {
    const snowAmounts = []

    _.forEach(parameters, (parameter) => {
      const location = _.find(locations, {'locationKey': parameter.$['applicable-location']})
      const snowParameter = _.find(parameter['precipitation'], (x) => x.$.type === 'snow')
      const timestamps = _.find(allTimestamps, {timeKey: snowParameter.$['time-layout']}).timestamps

      snowAmounts.push(_.map(snowParameter.value, (x, index) => {
        return {
          timestamp: timestamps[index],
          type: snowParameter.$.type,
          units: snowParameter.$.units,
          value: Number(x),
          location: `${location.latitude}, ${location.longitude}`
        }
      }))
    })
    return _.flatten(snowAmounts)
  },

  getIceAmounts(locations, allTimestamps, parameters) {
    const iceAmounts = []

    _.forEach(parameters, (parameter) => {
      const location = _.find(locations, {'locationKey': parameter.$['applicable-location']})
      const iceParameter = _.find(parameter['precipitation'], (x) => x.$.type === 'ice')
      const timestamps = _.find(allTimestamps, {timeKey: iceParameter.$['time-layout']}).timestamps

      iceAmounts.push(_.map(iceParameter.value, (x, index) => {
        return {
          timestamp: timestamps[index],
          type: iceParameter.$.type,
          units: iceParameter.$.units,
          value: isNaN(Number(x)) ? 'UNAVAILABLE' : Number(x),
          location: `${location.latitude}, ${location.longitude}`
        }
      }))
    })
    return _.flatten(iceAmounts)
  },

  getFireAmounts(locations, allTimestamps, parameters) {
    const fireAmounts = []

    _.forEach(parameters, (parameter) => {
      const location = _.find(locations, {'locationKey': parameter.$['applicable-location']})
      const fireParameters = parameter['fire-weather']

      _.forEach(fireParameters, (fireParameter) => {
        const timestamps = _.find(allTimestamps, {timeKey: fireParameter.$['time-layout']}).timestamps

        fireAmounts.push(
          _.map(fireParameter.value, (x, index) => {
            return {
              timestamp: timestamps[index],
              type: fireParameter.$.type,
              units: 'Not Applicable',
              areas: x,
              location: `${location.latitude}, ${location.longitude}`
            }
          })
        )
      })
    })

    return _.flatten(fireAmounts)
  },

  getConvectiveHazardAmounts(locations, allTimestamps, parameters) {
    const convectiveHazardAmounts = []

    _.forEach(parameters, (parameter) => {
      const location = _.find(locations, {'locationKey': parameter.$['applicable-location']})

      _.forEach(parameter['convective-hazard'], (convectiveHazard) => {
        const severeComponent = convectiveHazard['severe-component'][0]
        const timestamps = _.find(allTimestamps, {timeKey: severeComponent.$['time-layout']}).timestamps

        convectiveHazardAmounts.push(
          _.map(severeComponent.value, (x, index) => {
            return {
              timestamp: timestamps[index],
              type: severeComponent.$.type,
              units: severeComponent.$.units,
              value: Number(x),
              location: `${location.latitude}, ${location.longitude}`
            }
          })
        )
      })
    })

    return _.flatten(convectiveHazardAmounts)
  }
};
