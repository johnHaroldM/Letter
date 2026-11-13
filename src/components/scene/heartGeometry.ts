import { BufferAttribute, IcosahedronGeometry, Vector3, type BufferGeometry } from 'three'

/**
 * Taubin's heart, an implicit surface (x: width, y: depth, z: up):
 *
 *   (x² + 9/4·y² + z² − 1)³ − x²·z³ − 9/80·y²·z³ = 0
 *
 * Negative inside, positive outside.
 */
function heartField(x: number, y: number, z: number) {
  const a = x * x + 2.25 * y * y + z * z - 1
  return a * a * a - (x * x + 0.1125 * y * y) * z * z * z
}

/**
 * Builds a smooth, plump heart about 2 units tall, centred on the origin.
 *
 * The surface is star-shaped around its centre (every ray from the origin
 * crosses it exactly once), so we can start from an evenly tessellated sphere
 * and push each vertex outward along its own ray until it meets the surface.
 * That gives uniform triangles with no poles or seams.
 *
 * @param detail    Subdivisions of the base icosahedron. 28 ≈ 17k triangles.
 * @param plumpness Depth scale. 1 is the mathematical heart; lower is slimmer.
 */
export function createHeartGeometry(detail = 28, plumpness = 0.86): BufferGeometry {
  const geometry = new IcosahedronGeometry(1, detail)
  const position = geometry.getAttribute('position') as BufferAttribute
  const normals = new Float32Array(position.count * 3)

  const ray = new Vector3()
  const normal = new Vector3()

  for (let i = 0; i < position.count; i++) {
    ray.fromBufferAttribute(position, i).normalize()

    // three.js axes (x, y up, z toward the viewer) → heart axes (x, y depth, z up)
    const dx = ray.x
    const dy = ray.z
    const dz = ray.y

    // Bisect along the ray for the surface crossing.
    let inside = 0
    let outside = 2
    for (let step = 0; step < 40; step++) {
      const middle = (inside + outside) * 0.5
      if (heartField(dx * middle, dy * middle, dz * middle) < 0) inside = middle
      else outside = middle
    }
    const radius = (inside + outside) * 0.5
    const x = dx * radius
    const y = dy * radius
    const z = dz * radius

    // Analytic normals keep reflections clean on glass. The cubic field above
    // has a vanishing gradient all around the heart's "equator", so we
    // differentiate the equivalent form  a − z·∛(x² + 9/80·y²) = 0  instead.
    const g = Math.max(x * x + 0.1125 * y * y, 1e-9)
    const root = Math.cbrt(g)
    const slope = z / (root * root)
    normal.set(
      2 * x * (1 - slope / 3),
      2 * z - root,
      (y * (4.5 - 0.075 * slope)) / plumpness,
    )
    if (normal.lengthSq() < 1e-12) normal.copy(ray)
    normal.normalize()

    position.setXYZ(i, x, z, y * plumpness)
    normals[i * 3] = normal.x
    normals[i * 3 + 1] = normal.y
    normals[i * 3 + 2] = normal.z
  }

  geometry.setAttribute('normal', new BufferAttribute(normals, 3))
  geometry.deleteAttribute('uv')

  // Centre vertically and normalise to two units tall.
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const height = box.max.y - box.min.y
  geometry.translate(0, -(box.max.y + box.min.y) / 2, 0)
  geometry.scale(2 / height, 2 / height, 2 / height)
  geometry.computeBoundingSphere()

  return geometry
}
