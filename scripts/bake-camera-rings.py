"""Run with Blender --background --factory-startup --python this_file -- source.glb output_dir.

Bake the original raised focus/zoom grip geometry onto the underlying rings.
The source GLB stays intact; output includes a packed Blender file and a new GLB.
"""
import bpy
import bmesh
import json
import math
import sys
from pathlib import Path

source, destination = sys.argv[sys.argv.index('--') + 1:]
destination = Path(destination).resolve()
destination.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(source).resolve()))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.render.bake.use_selected_to_active = True
scene.render.bake.cage_extrusion = 0.002
scene.render.bake.max_ray_distance = 0.004
scene.render.bake.normal_space = 'TANGENT'
scene.render.bake.margin = 12

def triangles(objects):
    total = 0
    for obj in objects:
        if obj.type == 'MESH':
            obj.data.calc_loop_triangles()
            total += len(obj.data.loop_triangles)
    return total

report = {'source': str(source), 'trianglesBefore': triangles(scene.objects), 'rings': []}
high_sources = []
for part in ['Focus', 'Zoom']:
    ring = bpy.data.objects[f'HMC_{part}Ring']
    knurl = bpy.data.objects[f'HMC_{part}Knurl']
    # The old GLB has split triangle vertices and knife-sharp grip edges.
    # Round those edges on the bake source so their slopes survive in the normal map.
    mesh = bmesh.new()
    mesh.from_mesh(knurl.data)
    bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.0000001)
    bmesh.ops.dissolve_limit(mesh, angle_limit=0.01, verts=list(mesh.verts), edges=list(mesh.edges))
    mesh.to_mesh(knurl.data)
    mesh.free()
    bevel = knurl.modifiers.new('Soft grip edges for baking', 'BEVEL')
    bevel.width = 0.00018
    bevel.segments = 3
    bevel.limit_method = 'ANGLE'
    high_ring = ring.copy()
    high_ring.data = ring.data.copy()
    high_ring.name = f'BakeSource_{part}Ring'
    scene.collection.objects.link(high_ring)
    high_sources.extend([high_ring, knurl])
    radius = max(math.hypot(v.co.x, v.co.y) for v in ring.data.vertices)
    half_depth = max(abs(v.co.z) for v in ring.data.vertices)
    uv = ring.data.uv_layers.active.data
    for face in ring.data.polygons:
        coords = [ring.data.vertices[ring.data.loops[i].vertex_index].co for i in face.loop_indices]
        angles = [(math.atan2(v.y, v.x) / math.tau) % 1 for v in coords]
        seam = max(angles) - min(angles) > 0.5
        for index, co, angle in zip(face.loop_indices, coords, angles):
            if abs(face.normal.z) > 0.95:
                uv[index].uv = ((0.25 if co.z > 0 else 0.75) + co.x / radius * 0.07,
                                0.91 + co.y / radius * 0.07)
            else:
                if seam and angle < 0.5:
                    angle += 1
                uv[index].uv = (0.02 + angle * 0.96, 0.08 + (co.z / half_depth + 1) * 0.36)
    material = ring.data.materials[0].copy()
    material.name = f'Baked{part}Rubber'
    ring.data.materials.clear()
    ring.data.materials.append(material)
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (0.008, 0.010, 0.013, 1)
    shader.inputs['Roughness'].default_value = 0.78
    shader.inputs['Metallic'].default_value = 0
    image = bpy.data.images.new(f'{part.lower()}-grip-normal', width=1024, height=512, alpha=False)
    image.colorspace_settings.name = 'Non-Color'
    texture = nodes.new('ShaderNodeTexImage')
    texture.image = image
    nodes.active = texture
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [high_ring, knurl, ring]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = ring
    bpy.ops.object.bake(type='NORMAL')
    image.filepath_raw = str(destination / f'{part.lower()}-grip-normal.png')
    image.file_format = 'PNG'
    image.save()
    image.pack()
    normal = nodes.new('ShaderNodeNormalMap')
    links.new(texture.outputs['Color'], normal.inputs['Color'])
    links.new(normal.outputs['Normal'], shader.inputs['Normal'])
    report['rings'].append({'name': part, 'sourceTriangles': triangles([high_ring, knurl]),
                            'shippedTriangles': triangles([ring]), 'normalMap': [1024, 512]})

for obj in high_sources:
    obj.hide_render = True
    obj.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
shipped = [obj for obj in scene.objects if obj not in high_sources]
for obj in shipped:
    obj.select_set(True)
report['trianglesAfter'] = triangles(shipped)
bpy.ops.export_scene.gltf(filepath=str(destination / 'panasonic-hmc150-baked.glb'),
                         export_format='GLB', use_selection=True, export_tangents=False,
                         export_cameras=False, export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(destination / 'camera-texture-bake.blend'))
(destination / 'bake-report.json').write_text(json.dumps(report, indent=2))
print('BAKE_REPORT', json.dumps(report))
