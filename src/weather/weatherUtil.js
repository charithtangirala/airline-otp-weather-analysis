const fs = require('fs')
const _ = require('lodash')
const child_process = require('child_process')

module.exports = {
    removeHistoricalWeatherFilesWithoutData() {
        const dir = process.cwd() + '/data/weather/historical/weatherUnderground/'
        fs.readdir(dir, (error, files) => {
            if(!error) {
                _.forEach(files, (file) => {
                    const content = fs.readFileSync(dir + file)
                    let lines = content.toString().split('\n')
                    lines = _.filter(lines, (line) => !_.isEmpty(line))

                    if(content.indexOf('No daily or hourly history data available')  >= 0 || lines.length == 1) {
                        fs.unlinkSync(dir+file)
                    } else {
                        child_process.execSync(`sed -i '' '/^\s*$/d' ${dir + file}`)
                    }
                })
            }
        })
    }
}