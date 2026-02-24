import * as THREE from "three";
export function orthographic(aspect: number, frustumSize: number) {
  const halfH = frustumSize / 2;
  const halfW = halfH * aspect;

  const camera = new THREE.OrthographicCamera(
    -halfW,
    halfW,
    halfH,
    -halfH,
    1,
    1000,
  )

  camera.position.set(100, 100, 100);

  camera.rotation.order = "YXZ";
  camera.rotation.y = - Math.PI / 4;
  camera.rotation.x = - Math.atan(1 / Math.sqrt(2));

  camera.updateProjectionMatrix()

  return camera;
}

export const camera = {
  orthographic,
};
