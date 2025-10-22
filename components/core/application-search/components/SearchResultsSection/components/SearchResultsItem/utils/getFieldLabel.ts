export function getFieldLabel(field: string) {
  switch (field.toLowerCase()) {
    case 'shortdescription':
    case 'longdescription': {
      return 'Description';
    }
    case 'tagline': {
      return 'Tags';
    }
    default: {
      return field;
    }
  }
}
