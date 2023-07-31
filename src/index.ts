import { SplatSurface } from "./splat-attack/splat-surface";

/**   SPLAT DEMO
 *  this file outlines the standard use of the splat module & all included
 *  components. the splat module allows you to create an interactive surface
 *  that players can paint with different colours of splat objects. you can
 *  find a detailed description of each component within its file.
 * 
 */
export function main() 
{
  //place splat surface (this lets the player paint the surface)
  SplatSurface.Move({x:8,y:0,z:8});
  SplatSurface.Scale({x:1,y:1,z:1});
}

/*
// UI
const canvas = new UICanvas()
const text = new UIText(canvas)
text.adaptWidth = true
text.fontSize = 16
text.color = Color4.Teal()
text.value = "Press 'E' to Calculate Area"

input.subscribe("BUTTON_DOWN", ActionButton.PRIMARY, false, () => {
  let areaCoveredText = calculateArea()
  if(areaCoveredText) {
    text.value = `Press 'E' to Recalculate\nArea Covered: ${areaCoveredText.toFixed(2)}m²`
  } else {
    text.value = "Press 'E' to Recalculate\nArea Covered: 0m²"
  }
  log("Calculating...")
  log(`Approximated Area Covered: ${areaCoveredText}m²`)
})
*/