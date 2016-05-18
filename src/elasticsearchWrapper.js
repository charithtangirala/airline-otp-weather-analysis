const _ = require('lodash')

module.exports = {
  indexWeatherData(client, itemsToIndex) {
    _.forEach(itemsToIndex, (weatherItem) => {
      _.forEach(weatherItem.data, (x) => {
        client.create({
          index: 'weather',
          type: weatherItem.type,
          id: `${x.type}_${x.timestamp}`,
          body: x
        }, (error, response) => {
          if(!error) {
            console.log('Indexing weather data in elasticsearch completed successfully.')
          }
        })
      })
    })
  }
}
