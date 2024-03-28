/**
 * Capitalizes the first letter of a string.
 * @param {string} string - The string to capitalize.
 * @returns {string} The capitalized string.
 */
module.exports.capitalizeFirstLetter = (string) => {
  return string.slice(0, 1).toUpperCase() + string.slice(1);
};
