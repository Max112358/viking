// database/triggers/index.js
module.exports = {
  createTimestampTriggers: require('./timestampTriggers'),
  createPositionTriggers: require('./positionTriggers'),
  createUrlTriggers: require('./urlTriggers'),
};
