const weatherUtil = require('./weatherUtil')
const elasticsearch = require('elasticsearch')
const weatherAction = require('./weatherAction')

const elasticsearchClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
})

/**
 * CLEAN HISTORICAL WEATHER DATA
 */
//weatherUtil.removeHistoricalWeatherFilesWithoutData()

/**
 * LOAD HISTORICAL WEATHER DATA
 */

//weatherAction.load('weatherUnderground', elasticsearchClient)
weatherAction.load('mesowest', elasticsearchClient)