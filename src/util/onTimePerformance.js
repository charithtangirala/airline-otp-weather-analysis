const Q = require('Q')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const csv = require("fast-csv")
const moment = require('moment')

module.exports = {
  load(elasticsearchClient) {
    const dir = process.cwd() + '/data/airline/onTimePerformance/'
    let onTimePerformanceRecords = []
    let count = 0
    let endCount = 0

    fs.readdir(dir, (error, files) => {
      if(!error) {
        _.forEach(files, (file) => {
          const stream = fs.createReadStream(dir+file)

          csv
           .fromStream(stream, {headers: true})
           .on("data", (record) => {
             let transformedRecord = omitUnnecessaryProperties(record)
             transformedRecord = convertNumberValues(transformedRecord)
             transformedRecord = convertTimeFieldsToDateTime(transformedRecord)

             if(count < 5000) {
               onTimePerformanceRecords.push({ index: { _index: 'airline',
                                                        _type: 'onTimePerformance',
                                                        _id: buildUniqueId(transformedRecord)
                                                      }
                                            })
               onTimePerformanceRecords.push(transformedRecord)
               count++
             } else {
              //  bulk Call
               elasticsearchClient.bulk({
                 body: onTimePerformanceRecords
               }, (error, result) => {
                 if(error) {
                   console.log('Error encountered while performing bulk index operation', error)
                 }
               })
               onTimePerformanceRecords = []
               count = 0
             }
           })
           .on("end", () => {
             endCount++

             if (onTimePerformanceRecords.length > 0) {
               elasticsearchClient.bulk({
                 body: onTimePerformanceRecords
               }, (error, result) => {
                 if(error) {
                   console.log('Error encountered while performing bulk index operation', error)
                 }
               })

               onTimePerformanceRecords = []
               count = 0
               console.log('End got called', endCount, 'times');
             }
           })
        })
      }
    })
  }
}

function buildUniqueId(onTimePerformanceRecord) {
  const id = `${onTimePerformanceRecord.UniqueCarrier}_${onTimePerformanceRecord.FlightDate}_${onTimePerformanceRecord.Origin}_${onTimePerformanceRecord.Dest}_${onTimePerformanceRecord.DepTime}_${onTimePerformanceRecord.ArrTime}_${onTimePerformanceRecord.FlightNum}_${onTimePerformanceRecord.TailNum}`

  return id
}

function omitUnnecessaryProperties(onTimePerformanceRecord) {
  const properties = Object.keys(onTimePerformanceRecord)
  const propertiesStartingWithDiv = _.filter(properties, (x) => x.startsWith('Div1') || x.startsWith('Div2') || x.startsWith('Div3') || x.startsWith('Div4') || x.startsWith('Div5'))
  const propertiesToOmit = _.concat(propertiesStartingWithDiv, ['Year', 'Quarter', 'Month', 'DayOfWeek', 'DayofMonth'])

  return _.omit(onTimePerformanceRecord, propertiesToOmit)
}

function convertNumberValues(onTimePerformanceRecord) {
  const numberProperties = ['OriginStateFips', 'OriginWac', 'DestStateFips', 'DestWac',
                            'DepDelay', 'DepDelayMinutes', 'DepDel15','DepartureDelayGroups',
                            'TaxiOut', 'TaxiIn', 'ArrDelay', 'ArrDelayMinutes',
                            'ArrDel15', 'ArrivalDelayGroups', 'Cancelled', 'Diverted',
                            'CRSElapsedTime', 'ActualElapsedTime', 'AirTime',
                            'Flights', 'Distance', 'DistanceGroup', 'CarrierDelay',
                            'WeatherDelay', 'NASDelay', 'SecurityDelay', 'LateAircraftDelay',
                            'TotalAddGTime', 'LongestAddGTime', 'DivAirportLandings',
                            'DivReachedDest', 'DivActualElapsedTime', 'DivArrDelay',
                            'DivDistance', 'FirstDepTime']

  return _.mapValues(onTimePerformanceRecord, (value, key) => {
    if(numberProperties.indexOf(key) >= 0) {
      return Number(onTimePerformanceRecord[key])
    }
    return value
  })
}

function convertTimeFieldsToDateTime(onTimePerformanceRecord) {
  const flightDate = onTimePerformanceRecord.FlightDate
  const timeFields = ['CRSDepTime', 'DepTime', 'WheelsOff', 'WheelsOn', 'CRSArrTime',
                      'ArrTime']

  _.forEach(timeFields, (timeField) => {
    const momentDateTime = moment(`${flightDate} ${onTimePerformanceRecord[timeField]}` , 'YYYY-MM-DD HHmm')

    onTimePerformanceRecord[timeField] = momentDateTime.format()
  })

  onTimePerformanceRecord.FlightDate = moment(flightDate, 'YYYY-MM-DD').format()

  return onTimePerformanceRecord
}
