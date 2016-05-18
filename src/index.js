const _ = require('lodash');
const weather = require('./weather');
const airportsUtil = require('./util/airports')
const { indexWeatherData } = require('./elasticsearchWrapper')
const { getLocations, getWindSpeedsForLocations,getTimestamps,
        getSnowAmounts, getIceAmounts, getFireAmounts, getConvectiveHazardAmounts
      } = require('./weatherForecastResponseParser');


// const weatherForecastRequest = weather.getForecast()

airportsUtil.parse().then((airports) => {
   const geoLocationsForCountries = airportsUtil.getGeoLocationsForCountries(airports, ['United States'])
   const geoLocationChunks = z

   // // Historical Weather Start
   //_.forEach(geoLocationChunks, (locations, index) => {
   //  setTimeout(function(x) {
   //    return () => {
   //      weather.getHistoricalWeather(x)
   //    }
   //  }(locations), 50000*(index+1))
   //})
   // // Historical Weather End

      // Weather Forecast Start
  // _.forEach(geoLocationChunks, (geoLocations) => {
  //   const weatherForecastRequest = weather.getForecastForGeolocations(geoLocations)
  //
  //   weatherForecastRequest.then((forecast) => {
  //     const locations = getLocations(forecast[0].location)
  //     const timestamps = getTimestamps(forecast[0]['time-layout'])
  //     const windSpeeds = getWindSpeedsForLocations(locations, timestamps, forecast[0].parameters)
  //     const snow = getSnowAmounts(locations, timestamps, forecast[0].parameters)
  //     const ice = getIceAmounts(locations, timestamps, forecast[0].parameters)
  //     const fire = getFireAmounts(locations, timestamps, forecast[0].parameters)
  //     const convectiveHazards = getConvectiveHazardAmounts(locations, timestamps, forecast[0].parameters)
  //
  //     console.log('windSpeeds:', windSpeeds.length, 'snow:', snow.length, 'ice:', ice.length, 'fire:', fire.length, 'convectiveHazards:', convectiveHazards.length)
  //     indexWeatherData(elasticsearchClient, [
  //       {type: 'wind', data: windSpeeds},
  //       {type: 'snow', data: snow},
  //       {type: 'ice', data: ice},
  //       {type: 'fire', data: fire},
  //       {type: 'convectiveHazards', data: convectiveHazards}
  //     ])
  //   })
  // })
    //Weather Forecast End
})
