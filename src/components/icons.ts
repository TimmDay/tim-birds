// Our own icon set for Species Cards, drawn from Lucide (ISC licence).
// Never Wingspan's icons (see AGENTS.md).
import Bean from '@lucide/astro/icons/bean';
import Bone from '@lucide/astro/icons/bone';
import Bug from '@lucide/astro/icons/bug';
import Building from '@lucide/astro/icons/building';
import Cherry from '@lucide/astro/icons/cherry';
import CircleDot from '@lucide/astro/icons/circle-dot';
import Droplets from '@lucide/astro/icons/droplets';
import Egg from '@lucide/astro/icons/egg';
import Fish from '@lucide/astro/icons/fish';
import Flower2 from '@lucide/astro/icons/flower-2';
import House from '@lucide/astro/icons/house';
import Layers from '@lucide/astro/icons/layers';
import Mountain from '@lucide/astro/icons/mountain';
import MoveHorizontal from '@lucide/astro/icons/move-horizontal';
import Rabbit from '@lucide/astro/icons/rabbit';
import Repeat from '@lucide/astro/icons/repeat';
import Route from '@lucide/astro/icons/route';
import Ruler from '@lucide/astro/icons/ruler';
import Sailboat from '@lucide/astro/icons/sailboat';
import Shell from '@lucide/astro/icons/shell';
import Snail from '@lucide/astro/icons/snail';
import Sun from '@lucide/astro/icons/sun';
import TreeDeciduous from '@lucide/astro/icons/tree-deciduous';
import Trees from '@lucide/astro/icons/trees';
import Utensils from '@lucide/astro/icons/utensils';
import Wheat from '@lucide/astro/icons/wheat';
import Wind from '@lucide/astro/icons/wind';
import type { Diet, Habitat, NestType } from '../lib/types.ts';

export { Egg, MoveHorizontal, Ruler };

export const HABITAT_ICON: Record<Habitat, typeof Trees> = {
  forest: Trees,
  woodland: TreeDeciduous,
  grassland: Wheat,
  wetland: Droplets,
  coastal: Shell,
  marine: Sailboat,
  arid: Sun,
  urban: Building,
};

export const DIET_ICON: Record<Diet, typeof Trees> = {
  insects: Bug,
  'other invertebrates': Snail,
  fish: Fish,
  seeds: Bean,
  fruit: Cherry,
  nectar: Flower2,
  vertebrates: Rabbit,
  carrion: Bone,
  omnivore: Utensils,
};

export const NEST_ICON: Record<NestType, typeof Trees> = {
  cup: CircleDot,
  hollow: TreeDeciduous,
  burrow: Mountain,
  platform: Layers,
  'ground scrape': Wheat,
  mound: Mountain,
  dome: House,
  none: Egg,
};

export const MIGRATION_ICON = {
  resident: House,
  'partial migrant': Repeat,
  migrant: Route,
  nomadic: Wind,
} as const;
