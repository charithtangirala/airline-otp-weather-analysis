const onTimePerformanceUtil = require('../util/onTimePerformance')

module.exports = {
    loadOnTimePerformanceData(elasticsearchClient) {
        onTimePerformanceUtil.load(elasticsearchClient)
    }
}