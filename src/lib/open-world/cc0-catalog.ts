export type Cc0ModelId =
  | 'quat_CommonTree_1'
  | 'quat_Willow_1'
  | 'kenney_tree_oak'
  | 'kenney_tree_pineTallA_detailed'
  | 'kenney_tree_detailed'
  | 'quat_BushBerries_1'
  | 'kenney_plant_bushDetailed'
  | 'kenney_flower_purpleA'
  | 'quat_Flowers'
  | 'kenney_mushroom_redGroup'
  | 'kenney_grass_large'
  | 'quat_Grass'
  | 'kenney_stump_roundDetailed'
  | 'quat_TreeStump_Moss'
  | 'kenney_log'
  | 'kenney_rock_largeA'
  | 'kenney_fence_simple'

export type Cc0MaterialRole =
  | 'foliage'
  | 'bark'
  | 'wood'
  | 'rock'
  | 'flower'
  | 'berry'
  | 'mushroom_cap'
  | 'mushroom_stem'
  | 'moss'
  | 'generic'

export interface Cc0ModelDef {
  id: Cc0ModelId
  file: string
  role: Cc0MaterialRole
  /** Target vertical size in world units after normalization */
  targetHeight: number
  instancing: boolean
}

export const CC0_MODELS: Cc0ModelDef[] = [
  { id: 'quat_CommonTree_1', file: 'quat_CommonTree_1.glb', role: 'foliage', targetHeight: 5.8, instancing: false },
  { id: 'quat_Willow_1', file: 'quat_Willow_1.glb', role: 'foliage', targetHeight: 4.6, instancing: false },
  { id: 'kenney_tree_oak', file: 'kenney_tree_oak.glb', role: 'foliage', targetHeight: 3.4, instancing: false },
  { id: 'kenney_tree_pineTallA_detailed', file: 'kenney_tree_pineTallA_detailed.glb', role: 'foliage', targetHeight: 4.2, instancing: false },
  { id: 'kenney_tree_detailed', file: 'kenney_tree_detailed.glb', role: 'foliage', targetHeight: 3.8, instancing: false },
  { id: 'quat_BushBerries_1', file: 'quat_BushBerries_1.glb', role: 'foliage', targetHeight: 1.1, instancing: true },
  { id: 'kenney_plant_bushDetailed', file: 'kenney_plant_bushDetailed.glb', role: 'foliage', targetHeight: 0.55, instancing: true },
  { id: 'kenney_flower_purpleA', file: 'kenney_flower_purpleA.glb', role: 'flower', targetHeight: 0.42, instancing: true },
  { id: 'quat_Flowers', file: 'quat_Flowers.glb', role: 'flower', targetHeight: 0.38, instancing: true },
  { id: 'kenney_mushroom_redGroup', file: 'kenney_mushroom_redGroup.glb', role: 'mushroom_cap', targetHeight: 0.35, instancing: true },
  { id: 'kenney_grass_large', file: 'kenney_grass_large.glb', role: 'foliage', targetHeight: 0.32, instancing: true },
  { id: 'quat_Grass', file: 'quat_Grass.glb', role: 'foliage', targetHeight: 0.28, instancing: true },
  { id: 'kenney_stump_roundDetailed', file: 'kenney_stump_roundDetailed.glb', role: 'wood', targetHeight: 0.45, instancing: true },
  { id: 'quat_TreeStump_Moss', file: 'quat_TreeStump_Moss.glb', role: 'moss', targetHeight: 0.55, instancing: true },
  { id: 'kenney_log', file: 'kenney_log.glb', role: 'wood', targetHeight: 0.35, instancing: true },
  { id: 'kenney_rock_largeA', file: 'kenney_rock_largeA.glb', role: 'rock', targetHeight: 0.55, instancing: true },
  { id: 'kenney_fence_simple', file: 'kenney_fence_simple.glb', role: 'wood', targetHeight: 0.9, instancing: true },
]

export const CC0_MODEL_BY_ID: Record<Cc0ModelId, Cc0ModelDef> = Object.fromEntries(
  CC0_MODELS.map((m) => [m.id, m]),
) as Record<Cc0ModelId, Cc0ModelDef>

export const CC0_BASE_URL = '/models/cc0/'
