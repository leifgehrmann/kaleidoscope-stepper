# kaleidoscope-stepper

A web-toy to explore how light reflects in a kaleidoscope.

## Usage

| URL Param | Name              | Description                                                                                                                                           | 
|-----------|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `s`       | Sides             | A number to control the number of sides of the shape. Fractional values like `3.5` are also supported, but are not regular polygons. Defaults to `4`. |
| `z`       | Scale/Zoom        | A number to control how zoomed in the kaleidoscope should be. A larger number results in more of the pattern. Defaults to `9`.                        |
| `r`       | Rotational Offset | A number to control the rotation of the shape in the center of the screen. Measured in Degrees. Defaults to `0`.                                      |
| `h`       | Hide Controls     | When set, the controls for the number of bounces are hidden. Disabled by default.                                                                     |

### Examples

* Equilateral: https://kaleidoscope-stepper.leifgehrmann.com/?s=3.0
* Isoceles: https://kaleidoscope-stepper.leifgehrmann.com/?s=2.6666
* Square: https://kaleidoscope-stepper.leifgehrmann.com/?s=4
* Pentagon: https://kaleidoscope-stepper.leifgehrmann.com/?s=5
* Hexagon: https://kaleidoscope-stepper.leifgehrmann.com/?s=6
* Example using all parameters, with controls disabled: https://kaleidoscope-stepper.leifgehrmann.com/?s=3&z=15&r=10&h

## Development

```shell
# Assuming npm is installed on the machine, install the dependencies.
npm install

# Start a development server, with hot-reloading.
npm run dev

# Checks that code follows the style guide.
npm run lint

# Generate a publishable build in dist, and start a server that hosts the app.
npm run build
npm run preview
```
