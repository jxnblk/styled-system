# Contrast

Constrast is a function that works in conjunction with the color function to automatically calculate whether the text color should be black or white based off of the background-color set on the component.

Example below

```
  const Example = styled.div`
    ${color}
    ${contrast}
  `;
  
  <Example bg="#FFF">BLACK</Example>
  <Example bg="#000">WHITE</Example>
```

So the first would have black text as the background is a light one, and the second example would have white text as the background is a dark one.

This will work for any color apart from the default browser colors.
