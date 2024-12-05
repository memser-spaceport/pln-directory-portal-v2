/**
 * Returns an object containing color and background color properties based on the provided group name.
 *
 * @param {string} groupName - The name of the group to get the color object for. 
 *                             Possible values are 'Team' and 'Project'.
 * @returns {Object} An object with the following properties:
 *                   - color: A string representing the color code.
 *                   - bgColor: A string representing the background color code.
 *
 * @example
 * const teamColors = getColorObject('Team');
 * // teamColors = { color: '#156FF7', bgColor: '#156FF71A' }
 *
 * const projectColors = getColorObject('Project');
 * // projectColors = { color: '#C050E6', bgColor: '#C050E61A' }
 *
 * const defaultColors = getColorObject('Other');
 * // defaultColors = { color: '#156ff7', bgColor: '#f1f5f9' }
 */
export const getColorObject = (groupName: string) => {
  switch (groupName) {
    case 'Team':
      return {
        color: '#156FF7',
        bgColor: '#156FF71A',
      };
    case 'Project':
      return {
        color: '#C050E6',
        bgColor: '#C050E61A',
      };
    default:
      return {
        color: '#156ff7',
        bgColor: '#f1f5f9',
      };
  }
};

export const validateName = (input:string) => {
  const nameRegex =  /^[a-zA-Z\s]*$/;
  return nameRegex.test(input);
};