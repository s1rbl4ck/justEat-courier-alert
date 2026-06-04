export function extractAssignedObject(html: string, variableName: string): any | null {
  const marker = `window.${variableName} = `;
  const markerIndex = html.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const objectStart = html.indexOf("{", markerIndex);
  if (objectStart === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let stringDelimiter = "";
  let escaped = false;

  for (let index = objectStart; index < html.length; index += 1) {
    const character = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === stringDelimiter) {
        inString = false;
      }

      continue;
    }

    if (character === '"' || character === "'") {
      inString = true;
      stringDelimiter = character;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        const objectLiteral = html.slice(objectStart, index + 1);

        try {
          return new Function(`return (${objectLiteral});`)();
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}
