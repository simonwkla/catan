import type { Scene } from "three";
import * as THREE from "three";
import { Vector2, VectorAx } from "@/lib/2d";
import { colorsHex } from "./colors";

type Field = VectorAx[];

type Ctx = {
  scene: Scene;
};

export function createField(field: Field, ctx: Ctx) {
  const { scene } = ctx;

  // --- “tile size” controls spacing between hex centers ---
  // Interpreting `size` as HEX RADIUS (center -> corner) in world units.
  const size = 10;

  // Make the tile a little thick (optional).
  const tileHeight = 1;

  // Build a hex prism mesh once, then instance it.
  const hexGeo = new THREE.CylinderGeometry(size, size, tileHeight, 6, 1, false);

  // If your axial->vector3 mapping expects pointy-top layout, this 30° rotation
  // often makes edges line up visually (toggle if it looks “rotated wrong”).
  hexGeo.rotateY(Math.PI / 6);

  // Put the tile’s bottom on y=0 (so it rests on the plane)
  hexGeo.translate(0, tileHeight / 2, 0);

  const material = new THREE.MeshStandardMaterial({
    color: colorsHex.red[500],
    // If you later want per-instance colors, set vertexColors: true and use setColorAt
    // vertexColors: true,
  });

  const mesh = new THREE.InstancedMesh(hexGeo, material, field.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < field.length; i++) {
    const ax = field[i];

    // Assumes VectorAx.toVector3(ax) returns a unit-ish axial position in XZ plane:
    // e.g. (x, 0, z) where x/z follow your axial layout.
    // We scale it by `size` (or by a different factor if your toVector3 already encodes spacing).
    const pos3d = VectorAx.toVector3(ax).clone().multiplyScalar(size);

    dummy.position.set(pos3d.x, 0, pos3d.z); // y stays 0; geometry is translated upward
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);

    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    // Optional: per-tile color (requires material.vertexColors = true)
    // const c = new THREE.Color(colorsHex.red[500]);
    // mesh.setColorAt(i, c);
  }

  mesh.instanceMatrix.needsUpdate = true;
  // if using per-instance colors:
  // if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  scene.add(mesh);
}