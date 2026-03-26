/generate
1. Reorganize the UI Layout.
   1. Make workflow a left aligned bar that contains all of the nodes vertically aligned
   2. Make the output a right aligned display
      1. There should be a drop down selector on the top of the right display to choose from the generated outputs to preview
      2. The core previewed genration should have the main scrolling view that allows for shifting through the slides
2. Editing slides
   1. Instead of rendering the slides as raw images, they should be rendered using Konva using the same render system as Pillow in the Python backend
   2. 