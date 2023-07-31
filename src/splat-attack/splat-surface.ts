/*    SPLAT SURFACE
    contains all functional components of the splat surface object, including file location
    model's location path, interface for placement calls, splat placement functionality, and
    total area calculation. 
*/

import { Entity, GltfContainer, InputAction, PointerEventType, PointerEvents, PointerEventsResult, Transform, engine, inputSystem } from "@dcl/sdk/ecs";
import { SplatObject } from "./splat-object";

//prepare splat surface object interactions
engine.addSystem(() => {
    //consume primary key-down event -> place splat object
    if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN, SplatSurface.GetSurfaceObject())){
        //access and process result
        const result = inputSystem.getInputCommand(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN, SplatSurface.GetSurfaceObject());
        if(result && result.hit && result.hit.position) {
            SplatSurface.PlaceSplatObject(result.hit.position);
        }
    }
    //consume secondary key-down event -> calculate volume
    if (inputSystem.isTriggered(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN, SplatSurface.GetSurfaceObject())){
        SplatSurface.DisplaySplatVolume();
    }
    //consume '1' key-down event -> reset splat objects
    if (inputSystem.isTriggered(InputAction.IA_ACTION_3, PointerEventType.PET_DOWN, SplatSurface.GetSurfaceObject())){
        SplatSurface.ResetSplatObjects();
    }
})

/** splat surface model location */
const MODEL_SPLAT_SURFACE:string = "models/splat-attack/splat-surface.glb";

/** object interface used to define all data required to manipulate the transform of the splat surface object */
export interface SplatSurfaceTransformData {
  x:number; y:number; z:number;
}

/** manages the state of the splat surface, acting as the interaction point for players to place splats & calculate the 
 *  entire area covered by splat objects.
 */
export module SplatSurface
{
    /** when true debug logs are generated (toggle off when you deploy) */
    const isDebugging:boolean = true;
    
    /** interaction surface used by player to create splats */
    var splatSurfaceEntity:undefined|Entity = undefined;

    /** returns the surface object, only one instance is maintained. */
    export function GetSurfaceObject():Entity {
        //ensure surface object has been initialized
        if(splatSurfaceEntity == undefined) {
            if(isDebugging) console.log("Splat Surface: object does not exist, creating new surface...");
            //create surface object
            //  entity
            splatSurfaceEntity = engine.addEntity();
            Transform.create(splatSurfaceEntity);
            //  custom model
            GltfContainer.create(splatSurfaceEntity, {
                src: MODEL_SPLAT_SURFACE,
                visibleMeshesCollisionMask: undefined,
                invisibleMeshesCollisionMask: undefined
            });
            //  pointer event system
            PointerEvents.create(splatSurfaceEntity, {
                pointerEvents: [
                  { //primary key -> places a new splat object
                    eventType: PointerEventType.PET_DOWN,
                    eventInfo: { button: InputAction.IA_PRIMARY, hoverText: "E - Place Splat" }
                  },
                  { //secondary key -> calculates the volume of all splat objects
                    eventType: PointerEventType.PET_DOWN,
                    eventInfo: { button: InputAction.IA_SECONDARY, hoverText: "F - Calculate Volume" }
                  },
                  { //secondary key -> resets the splat surface
                    eventType: PointerEventType.PET_DOWN,
                    eventInfo: { button: InputAction.IA_ACTION_3, hoverText: "1 - Reset Splat Surface" }
                  }
                ]
            });
            if(isDebugging) console.log("Splat Surface: created new surface!");
        }
        return splatSurfaceEntity;
    }

    export function PlaceSplatObject(position:SplatSurfaceTransformData) {
        if(isDebugging) console.log("Splat Surface: action call -> place splat object");
        //place splat object
        SplatObject.Create(position);
        //add splat's volume as a new circle listing
        circles.push(new Circle(position.x, position.y, 0.5));
    }

    export function DisplaySplatVolume() {
        if(isDebugging) console.log("Splat Surface: action call -> display splat volume");
        //get splat volume amount
        const splatVolume = calculateArea();
        //update ui
    }

    export function ResetSplatObjects() {
        if(isDebugging) console.log("Splat Surface: action call -> reset splat objects");
        //disable all splat objects
        SplatObject.DisableAll();
        //reset volume data
        circles = [];
    }

    /** moves the splat surface to the given location */
    export function Move(mod:SplatSurfaceTransformData) {
        if(isDebugging) console.log("Splat Surface: splat surface moved to pos(x="+mod.x+", y="+mod.y+", z="+mod.z+")");
        Transform.getMutable(GetSurfaceObject()).position = mod;
    }

    /** rescales the splat surface to the given size */
    export function Scale(mod:SplatSurfaceTransformData) {
        if(isDebugging) console.log("Splat Surface: splat surface rescaled to scale(x="+mod.x+", y="+mod.y+", z="+mod.z+")");
        Transform.getMutable(GetSurfaceObject()).scale = mod;
    }
    
    /*          circle fill calculation
    *   adapted from the grid sampling solution versino 4 to the total circles area problem.
    *   link: https://rosettacode.org/wiki/Total_circles_area#Grid_Sampling_Version_4
    * 
    *   NOTE: also works with any circle with an arbitrary radius
    */

    /** represents a splat's volume */
    class Circle {
        constructor(public x: number, public y: number, public r: number) {

        }
    }
    const sample_size = 256;
    /** listing of all circles */
    var circles: Circle[] = [];
    //grid diff sets
    var x_min_diffs: number[];
    var x_max_diffs: number[];
    var y_min_diffs: number[];
    var y_max_diffs: number[];
    
    /** returns the full area covered by all circles within the circle array, represents volume of splat */
    function calculateArea(): number {
        if(isDebugging) console.log("Splat Surface: calculating splat area...");
        //reset processing arrays
        x_min_diffs = [];
        x_max_diffs = [];
        y_min_diffs = [];
        y_max_diffs = [];
        //process all circles, adding their range bounds to the calc map
        for (let c of circles) {
            x_min_diffs.push(c.x - c.r);
            x_max_diffs.push(c.x + c.r);
            y_min_diffs.push(c.y - c.r);
            y_max_diffs.push(c.y + c.r);
        }
        //determine coverage
        let x_min = Math.min(...x_min_diffs);
        let x_max = Math.max(...x_max_diffs);
        let y_min = Math.min(...y_min_diffs);
        let y_max = Math.max(...y_max_diffs);
        //sampling definition
        let dx = (x_max - x_min) / sample_size;
        let dy = (y_max - y_min) / sample_size;
        //process range check, adding each new extension on the grid
        let count = 0;
        for (let r = 0; r < sample_size; r++) {
            let y = y_min + r * dy
            for (let c = 0; c < sample_size; c++) {
                let x = x_min + c * dx
                for (let i = 0; i < circles.length; i++) {
                    if (Math.pow(x - circles[i].x, 2) + Math.pow(y - circles[i].y, 2) <= Math.pow(circles[i].r, 2)) {
                        count += 1;
                        break;
                    }
                }
            }
        }
        let areaCovered = count * dx * dy;
        if(isDebugging) console.log("Splat Surface: calculated splat area="+areaCovered);
        return areaCovered;
    }
}