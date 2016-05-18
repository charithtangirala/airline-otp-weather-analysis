const request = require('request')
const xml2js = require('xml2js')
const moment = require('moment')
const csv = require('fast-csv')
const _ = require('lodash')
const url = require('url')
const fs = require('fs')
const Q = require('Q')

module.exports = {
    requestForecastForGeoLocations(geoLocations) {
        const deferred = Q.defer()
        const queryParamsString = constructQueryParams(geoLocations)
        const requestUrl = url.format({
            protocol: 'http',
            hostname: 'graphical.weather.gov',
            pathname: 'xml/sample_products/browser_interface/ndfdXMLclient.php',
            query: queryParamsString
        });

        request(requestUrl, (error, response, body) => {
            if(!error && response.statusCode == 200) {
                xml2js.parseString(body, function(err, result) {
                    if(!err) {
                        if (result.error) {
                            console.log(result.error.pre)
                            deferred.reject(result.error.pre)
                        } else {
                            deferred.resolve(result.dwml.data)
                        }
                    } else {
                        deferred.reject(err)
                    }
                });
            } else {
                console.log('Error encountered while making weather forecast request', error)
                deferred.reject(error)
            }
        })

        return deferred.promise
    },

    requestHistoricalWeather(locations) {
        const promises = []

        _.forEach(locations, (location) => {
            let day = 1

            while(day <= 31) {
                const deferred = Q.defer()
                const requestUrl = url.format({
                    protocol: 'http',
                    hostname: 'wunderground.com',
                    pathname: `/history/airport/${location.icao}/2015/11/${day}/DailyHistory.html`,
                    query: {format: 1}
                })

                request(requestUrl, (error, response, body) => {
                    if(!error && response.statusCode == 200) {
                        const fileName = _.trim(response.req._header.split(' ')[1].split('DailyHistory.html')[0].replace(new RegExp('/', 'g'), '_'), '_')

                        body = body.replace(new RegExp('<br />', 'g'), '');
                        fs.writeFile(`data/weather/historical/${fileName}.data`, body, (error) => {
                            if(error) {
                                console.log(`Error while writing historical weather data for ${location.icao}_2015_1_${day}.data`, error)
                            }
                        })
                        deferred.resolve(body)
                    } else {
                        console.log('Error encountered while making historical weather request for URL:', requestUrl, error)
                        deferred.reject(error)
                    }
                })

                promises.push(deferred.promise)
                day++
            }
        })

        return promises
    },

    load(source, elasticsearchClient) {
        const dir = `${process.cwd()}/data/weather/historical/${source}/`

        const fileChunks = _.chunk(fs.readdirSync(dir), 10)

        let jsonObjectsToIndex = []
        let count = 0

        _.forEach(fileChunks[9], (file) => {
            const data = fs.readFileSync(dir+file)
            const lines = data.toString().split('\n').filter((line) => !_.isEmpty(line))
            const header = lines[0]
            const dataLines = _.tail(lines)

            _.forEach(dataLines, (dataLine) => {
                let dataToLoad
                let uniqueDocumentId

                switch (source) {
                    case 'weatherUnderground':
                        dataToLoad = buildJsonObjectForWeatherUnderground(file, header, dataLine)
                        uniqueDocumentId = buildUniqueDocumentIdForWeatherUnderground()
                    case 'mesowest':
                        dataToLoad = buildJsonObjectForMesowest(file, header, dataLine)
                        uniqueDocumentId = buildUniqueDocumentIdForMesowest(file, dataToLoad)
                }

                if(count < 3000) {
                    jsonObjectsToIndex.push({ index: { _index: 'weather',
                                                       _type: _.camelCase(`historicalBy${source}`),
                                                       _id: uniqueDocumentId
                                                     }
                    })
                    jsonObjectsToIndex.push(dataToLoad)
                    count++
                } else {
                    elasticsearchClient.bulk({
                        body: jsonObjectsToIndex
                    }, (error, result) => {
                        if(error) {
                            console.log('Error encountered while performing bulk index operation', error)
                        }
                    })
                    jsonObjectsToIndex = []
                    count = 0
                }
            })
        })

        if(count > 0) {
            elasticsearchClient.bulk({
                body: jsonObjectsToIndex
            }, (error, result) => {
                if(error) {
                    console.log('Error encountered while performing bulk index operation', error)
                }
            })

            jsonObjectsToIndex = []
            count = 0
        }
    }
}

function buildJsonObjectForWeatherUnderground(file, header, dataLine) {
    const iata = file.split('_')[2]
    const keys = header.split(',')
    const values = dataLine.split(',')

    if(keys.length === values.length) {
        let obj = {'iata': `K${iata}`}

        _.forEach(keys, (key, index) => {
            let value = isNaN(Number(values[index])) ? values[index] : Number(values[index])
            value = value === '-' ? 0 : value
            value = key === 'PrecipitationIn' && value === 'N/A' ? 0 : value

            obj[key] = value
        })

        obj['DateUTC'] = moment(obj.DateUTC + '+0000', 'YYYY-MM-DD HH:mm:ss Z')
        obj['Events'] = obj['Events'] === 0 ? 'NONE' : obj['Events']
        obj['Humidity'] = obj['Humidity'] === 'N/A' ? 0 : obj['Humidity']

        return obj
    }

    return {}
}

function buildJsonObjectForMesowest(file, header, dataLine) {
    const iata = file.split('_')[0]
    const keys = header.split(',')
    const values = dataLine.split(',')

    const keysMap = {
        MON: 'month',
        DAY: 'day',
        YEAR: 'year',
        HR: 'hour',
        MIN: 'min',
        TMZN: 'timezone',
        TMPF: 'temperatureInFahrenheit',
        RELH: 'reletiveHumidity',
        SKNT: 'windSpeed',
        GUST: 'windGust',
        DRCT: 'windDirection',
        WNUM: 'weatherConditions',
        VSBY: 'visibility',
        P01I: 'precipitation1hr',
        P03I: 'precipitation3hr',
        P06I: 'precipitation6hr',
        P24I: 'precipitation24hr',
        CHC1: 'cloudLayer1Coverage',
        CHC2: 'cloudLayer2Coverage',
        CHC3: 'cloudLayer3Coverage',
        CIG: 'ceiling',
        PDIR: 'peakWindDirection',
        DWPF: 'dewPoint'
    }

    if(keys.length === values.length) {
        let obj = {iata: iata}

        _.forEach(Object.keys(keysMap), (key) => {
            const value = isNaN(Number(values[keys.indexOf(key)])) ? values[keys.indexOf(key)] : Number(values[keys.indexOf(key)])

            obj[keysMap[key]] = value
        })
        obj.dateTimeUTC = moment(`${obj.year}-${obj.month}-${obj.day} ${obj.hour}:${obj.min}`, 'YYYY-MM-DD HH:mm')

        return obj
    }

    return {}
}

function buildUniqueDocumentIdForMesowest(file, document) {
    return `${file.split('.')[0]}_${document.month}_${document.day}_${document.hour}_${document['min']}`
}

function constructQueryParams(locations) {
    const locationParam = _.chain(locations).take(6).map((x) => {return `${x.latitude},${x.longitude}`}).join(' ').value()

    return {
        whichClient: 'NDFDgenLatLonList',
        listLatLon: locationParam,
        product: 'time-series',
        begin: '2004-02-21T00:00:00',
        end: '2020-02-28T00:00:00',
        Unit: 'e',
        ptornado: 'ptornado',
        phail: 'phail',
        ptstmwinds: 'ptstmwinds',
        pxtornado: 'pxtornado',
        pxtstmwinds: 'pxtstmwinds',
        wspd: 'wspd',
        rh: 'rh',
        critfireo: 'critfireo',
        dryfireo: 'dryfireo',
        ptornado: 'ptornado',
        phail: 'phail',
        pxhail: 'pxhail',
        wwa: 'wwa',
        wgust: 'wgust',
        iceaccum: 'iceaccum',
        snow: 'snow'
    }
}
