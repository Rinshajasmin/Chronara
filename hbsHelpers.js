const moment = require("moment");

module.exports = {
  formatDate: (date, format) => moment(date).local().format(format),

  eq: (a, b) => a === b,

  statusClass: (status) => {
    switch (status) {
      case "Pending":
        return "text-warning";
      case "Shipped":
        return "text-primary";
      case "Delivered":
        return "text-success";
      case "Cancelled":
        return "text-danger";
      default:
        return "text-secondary";
    }
  },

  or: (v1, v2) => v1 || v2,

  isActive: (expiryDate) => {
    const currentDate = moment();
    const expiry = moment(expiryDate);
    return currentDate.isBefore(expiry);
  },

  ifCond: function (value1, value2, options) {
    return value1 === value2 ? options.fn(this) : options.inverse(this);
  },

  neq: (a, b) => a !== b,

  and: function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(Boolean);
  },

  contains: (value, substring) => value && value.includes(substring),

  ifEquals: function (value1, value2, options) {
    if (value1 == null || value2 == null) {
      return options.inverse(this);
    }
    return value1.toString() === value2.toString()
      ? options.fn(this)
      : options.inverse(this);
  },

  add: (a, b) => a + b,

  subtract: (a, b) => a - b,

  range: (start, end) => {
    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  },

  gt: (a, b) => a > b,

  lt: (a, b) => a < b,

  json: (context) => JSON.stringify(context),

  formatPrice: (value) => Number(value).toFixed(2),
};
