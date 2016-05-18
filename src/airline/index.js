const elasticsearch = require('elasticsearch')
const airlineAction = require('./airlineAction')

const elasticsearchClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
})

airlineAction.loadOnTimePerformanceData(elasticsearchClient)