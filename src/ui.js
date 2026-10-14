import { ELEMENTS, ELEMENT_IDS, ELEMENT_CATS, LEGENDARY_IDS, FINAL_IDS, CATEGORIES, RECIPES, ACHIEVEMENTS, VARIANTS, recipeKey, CAT_ORDER, TREE_MAX_DEPTH, DEPTH_GROUPS, MAX_DEPTH } from './data.js';
import { buildIconSVG, ICON_DESIGNS, TIER, textSafeColor } from './icons.js';
import { state, saveGame, getPlayMs } from './state.js';
import { notebook, saveNotebook, renderWhisperText, revealRecipe, pickSacrificeRecipe, getRecipeProgressForOutput, getRemainingRecipes, getRevealCost, canSacrifice, getRequiredAmount, getCategoryHint, getCategoryLabel } from './notebook.js';
import { playDrop, playAchievement, playDiscover } from './audio.js';

function hexRgba(hex, alpha) {
  return `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${alpha})`;
}

// Глифы кита для мелких строк (без медальона): та же нумерация, что у медалей
export const KIT_GLYPH = {
  fire: 'elements/glyph/fire.svg',
  water: 'elements/glyph/water.svg',
  earth: 'elements/glyph/earth.svg',
  air: 'elements/glyph/air.svg',
  void: 'elements/glyph/void.svg',
  spirit: 'elements/glyph/spirit.svg',
  matter: 'elements/glyph/matter.svg',
  time: 'elements/glyph/time.svg',
  space: 'elements/glyph/space.svg',
  chaos: 'elements/glyph/chaos.svg',
  entropy: 'elements/glyph/entropy.svg',
  steam: 'states/glyph/steam.svg',
  hotSteam: 'states/glyph/hotSteam.svg',
  wetSteam: 'states/glyph/wetSteam.svg',
  ice: 'states/glyph/ice.svg',
  mist: 'states/glyph/mist.svg',
  dust: 'states/glyph/dust.svg',
  ash: 'states/glyph/ash.svg',
  lava: 'states/glyph/lava.svg',
  magma: 'states/glyph/magma.svg',
  scoria: 'states/glyph/scoria.svg',
  mud: 'states/glyph/mud.svg',
  sludge: 'states/glyph/sludge.svg',
  storm: 'states/glyph/storm.svg',
  inferno: 'states/glyph/inferno.svg',
  gale: 'states/glyph/gale.svg',
  thunder: 'states/glyph/thunder.svg',
  frost: 'states/glyph/frost.svg',
  bubble: 'states/glyph/bubble.svg',
  echo: 'states/glyph/echo.svg',
  wood: 'nature/glyph/wood.svg',
  forest: 'nature/glyph/forest.svg',
  flower: 'nature/glyph/flower.svg',
  life: 'nature/glyph/life.svg',
  swamp: 'nature/glyph/swamp.svg',
  poison: 'nature/glyph/poison.svg',
  moss: 'nature/glyph/moss.svg',
  spring: 'nature/glyph/spring.svg',
  mountain: 'nature/glyph/mountain.svg',
  coral: 'nature/glyph/coral.svg',
  vine: 'nature/glyph/vine.svg',
  root: 'nature/glyph/root.svg',
  mushroom: 'nature/glyph/mushroom.svg',
  seed: 'nature/glyph/seed.svg',
  spore: 'nature/glyph/spore.svg',
  plague: 'nature/glyph/plague.svg',
  parasite: 'nature/glyph/parasite.svg',
  livingShield: 'nature/glyph/livingShield.svg',
  canyon: 'nature/glyph/canyon.svg',
  whisperingWinds: 'nature/glyph/whisperingWinds.svg',
  maelstrom: 'nature/glyph/maelstrom.svg',
  tempest: 'nature/glyph/tempest.svg',
  ancientGrove: 'nature/glyph/ancientGrove.svg',
  treant: 'nature/glyph/treant.svg',
  worldTree: 'nature/glyph/worldTree.svg',
  eternalBlight: 'nature/glyph/eternalBlight.svg',
  virulentSwarm: 'nature/glyph/virulentSwarm.svg',
  primordialStorm: 'nature/glyph/primordialStorm.svg',
  chaosStorm: 'nature/glyph/chaosStorm.svg',
  mourningGrove: 'nature/glyph/mourningGrove.svg',
  plagueStorm: 'nature/glyph/plagueStorm.svg',
  erosion: 'nature/glyph/erosion.svg',
  decay: 'nature/glyph/decay.svg',
  ruin: 'nature/glyph/ruin.svg',
  sprout: 'nature/glyph/sprout.svg',
  sapling: 'nature/glyph/sapling.svg',
  mass: 'nature/glyph/mass.svg',
  density: 'nature/glyph/density.svg',
  compression: 'nature/glyph/compression.svg',
  substance: 'nature/glyph/substance.svg',
  bedrock: 'nature/glyph/bedrock.svg',
  metal: 'metal/glyph/metal.svg',
  steel: 'metal/glyph/steel.svg',
  blade: 'metal/glyph/blade.svg',
  rust: 'metal/glyph/rust.svg',
  stone: 'metal/glyph/stone.svg',
  crystal: 'metal/glyph/crystal.svg',
  diamond: 'metal/glyph/diamond.svg',
  gold: 'metal/glyph/gold.svg',
  silver: 'metal/glyph/silver.svg',
  iron: 'metal/glyph/iron.svg',
  engine: 'metal/glyph/engine.svg',
  plasmaBlade: 'metal/glyph/plasmaBlade.svg',
  monolith: 'metal/glyph/monolith.svg',
  ironWill: 'metal/glyph/ironWill.svg',
  forgeHeart: 'metal/glyph/forgeHeart.svg',
  absoluteMass: 'metal/glyph/absoluteMass.svg',
  copper: 'metal/glyph/copper.svg',
  bronze: 'metal/glyph/bronze.svg',
  platinum: 'metal/glyph/platinum.svg',
  wire: 'metal/glyph/wire.svg',
  magnet: 'metal/glyph/magnet.svg',
  temperedBlade: 'metal/glyph/temperedBlade.svg',
  chainmail: 'metal/glyph/chainmail.svg',
  filigree: 'metal/glyph/filigree.svg',
  adamant: 'metal/glyph/adamant.svg',
  relicBlade: 'metal/glyph/relicBlade.svg',
  glass: 'artifact/glyph/glass.svg',
  brick: 'artifact/glyph/brick.svg',
  ceramic: 'artifact/glyph/ceramic.svg',
  clay: 'artifact/glyph/clay.svg',
  crown: 'artifact/glyph/crown.svg',
  amulet: 'artifact/glyph/amulet.svg',
  rune: 'artifact/glyph/rune.svg',
  prism: 'artifact/glyph/prism.svg',
  mirror: 'artifact/glyph/mirror.svg',
  clockwork: 'artifact/glyph/clockwork.svg',
  scroll: 'artifact/glyph/scroll.svg',
  lantern: 'artifact/glyph/lantern.svg',
  key: 'artifact/glyph/key.svg',
  shield: 'artifact/glyph/shield.svg',
  athanor: 'artifact/glyph/athanor.svg',
  philosophersEgg: 'artifact/glyph/philosophersEgg.svg',
  vesselOfLife: 'artifact/glyph/vesselOfLife.svg',
  hermeticSeal: 'artifact/glyph/hermeticSeal.svg',
  furnace: 'artifact/glyph/furnace.svg',
  amberRelic: 'artifact/glyph/amberRelic.svg',
  auroraCrown: 'artifact/glyph/auroraCrown.svg',
  resonator: 'artifact/glyph/resonator.svg',
  grimoire: 'artifact/glyph/grimoire.svg',
  necronomicon: 'artifact/glyph/necronomicon.svg',
  oneirograph: 'artifact/glyph/oneirograph.svg',
  possessedArmor: 'artifact/glyph/possessedArmor.svg',
  golemCore: 'artifact/glyph/golemCore.svg',
  worldAnvil: 'artifact/glyph/worldAnvil.svg',
  spatialAnchor: 'artifact/glyph/spatialAnchor.svg',
  lighthouse: 'artifact/glyph/lighthouse.svg',
  guardian: 'entity/glyph/guardian.svg',
  golem: 'entity/glyph/golem.svg',
  ghost: 'entity/glyph/ghost.svg',
  phoenix: 'entity/glyph/phoenix.svg',
  siren: 'entity/glyph/siren.svg',
  fairy: 'entity/glyph/fairy.svg',
  phantom: 'entity/glyph/phantom.svg',
  homunculus: 'entity/glyph/homunculus.svg',
  adept: 'entity/glyph/adept.svg',
  basilisk: 'entity/glyph/basilisk.svg',
  wyvern: 'entity/glyph/wyvern.svg',
  leviathan: 'entity/glyph/leviathan.svg',
  trickster: 'entity/glyph/trickster.svg',
  nemesis: 'entity/glyph/nemesis.svg',
  revenant: 'entity/glyph/revenant.svg',
  sentinel: 'entity/glyph/sentinel.svg',
  banshee: 'entity/glyph/banshee.svg',
  lich: 'entity/glyph/lich.svg',
  abyssalSovereign: 'entity/glyph/abyssalSovereign.svg',
  deathlessWarden: 'entity/glyph/deathlessWarden.svg',
  wraithLord: 'entity/glyph/wraithLord.svg',
  titan: 'entity/glyph/titan.svg',
  chaosBeast: 'entity/glyph/chaosBeast.svg',
  voidSpawn: 'entity/glyph/voidSpawn.svg',
  rex: 'entity/glyph/rex.svg',
  regina: 'entity/glyph/regina.svg',
  rebis: 'entity/glyph/rebis.svg',
  choirOfSorrow: 'entity/glyph/choirOfSorrow.svg',
  fatebreaker: 'entity/glyph/fatebreaker.svg',
  willOWisp: 'entity/glyph/willOWisp.svg',
  deathKnight: 'entity/glyph/deathKnight.svg',
  elementalWarden: 'entity/glyph/elementalWarden.svg',
  hollow: 'entity/glyph/hollow.svg',
  faithfulFlame: 'entity/glyph/faithfulFlame.svg',
  husk: 'entity/glyph/husk.svg',
  ardentGuardian: 'entity/glyph/ardentGuardian.svg',
  gravewarden: 'entity/glyph/gravewarden.svg',
  fatewalker: 'entity/glyph/fatewalker.svg',
  worldsmith: 'entity/glyph/worldsmith.svg',
  banisher: 'entity/glyph/banisher.svg',
  wayfinder: 'entity/glyph/wayfinder.svg',
  psychopomp: 'entity/glyph/psychopomp.svg',
  philosophersStone: 'legendary/glyph/philosophersStone.svg',
  chimera: 'legendary/glyph/chimera.svg',
  aurumPotabile: 'legendary/glyph/aurumPotabile.svg',
  panacea: 'legendary/glyph/panacea.svg',
  animaMundi: 'legendary/glyph/animaMundi.svg',
  apocalypse: 'legendary/glyph/apocalypse.svg',
  greatBinding: 'legendary/glyph/greatBinding.svg',
  masterOfTime: 'legendary/glyph/masterOfTime.svg',
  masterOfSpace: 'legendary/glyph/masterOfSpace.svg',
  spacetimeContinuum: 'legendary/glyph/spacetimeContinuum.svg',
  chaosLord: 'legendary/glyph/chaosLord.svg',
  entropyLord: 'legendary/glyph/entropyLord.svg',
  oblivion: 'legendary/glyph/oblivion.svg',
  potion: 'alchemy/glyph/potion.svg',
  acid: 'alchemy/glyph/acid.svg',
  pearl: 'alchemy/glyph/pearl.svg',
  sand: 'alchemy/glyph/sand.svg',
  obsidian: 'alchemy/glyph/obsidian.svg',
  fossil: 'alchemy/glyph/fossil.svg',
  geyser: 'alchemy/glyph/geyser.svg',
  hurricane: 'alchemy/glyph/hurricane.svg',
  lightning: 'alchemy/glyph/lightning.svg',
  plasma: 'alchemy/glyph/plasma.svg',
  death: 'alchemy/glyph/death.svg',
  amber: 'alchemy/glyph/amber.svg',
  elixir: 'alchemy/glyph/elixir.svg',
  catalyst: 'alchemy/glyph/catalyst.svg',
  salt: 'alchemy/glyph/salt.svg',
  rawSulfur: 'alchemy/glyph/rawSulfur.svg',
  rawMercury: 'alchemy/glyph/rawMercury.svg',
  sulfurPhil: 'alchemy/glyph/sulfurPhil.svg',
  mercuryPhil: 'alchemy/glyph/mercuryPhil.svg',
  saltPhil: 'alchemy/glyph/saltPhil.svg',
  nigredo: 'alchemy/glyph/nigredo.svg',
  albedo: 'alchemy/glyph/albedo.svg',
  citrinitas: 'alchemy/glyph/citrinitas.svg',
  rubedo: 'alchemy/glyph/rubedo.svg',
  azoth: 'alchemy/glyph/azoth.svg',
  solve: 'alchemy/glyph/solve.svg',
  coagula: 'alchemy/glyph/coagula.svg',
  alkahest: 'alchemy/glyph/alkahest.svg',
  elixirVitae: 'alchemy/glyph/elixirVitae.svg',
  ambrosia: 'alchemy/glyph/ambrosia.svg',
  ignition: 'alchemy/glyph/ignition.svg',
  coal: 'alchemy/glyph/coal.svg',
  briquette: 'alchemy/glyph/briquette.svg',
  aetherCore: 'alchemy/glyph/aetherCore.svg',
  primeMatter: 'alchemy/glyph/primeMatter.svg',
  volatileMatter: 'alchemy/glyph/volatileMatter.svg',
  ether: 'cosmos/glyph/ether.svg',
  star: 'cosmos/glyph/star.svg',
  nova: 'cosmos/glyph/nova.svg',
  meteor: 'cosmos/glyph/meteor.svg',
  moon: 'cosmos/glyph/moon.svg',
  sun: 'cosmos/glyph/sun.svg',
  galaxy: 'cosmos/glyph/galaxy.svg',
  eclipse: 'cosmos/glyph/eclipse.svg',
  quintessence: 'cosmos/glyph/quintessence.svg',
  macrocosm: 'cosmos/glyph/macrocosm.svg',
  voidRift: 'cosmos/glyph/voidRift.svg',
  axis: 'cosmos/glyph/axis.svg',
  worldsEnd: 'cosmos/glyph/worldsEnd.svg',
  genesis: 'cosmos/glyph/genesis.svg',
  axisKeeper: 'cosmos/glyph/axisKeeper.svg',
  blackHole: 'cosmos/glyph/blackHole.svg',
  singularity: 'cosmos/glyph/singularity.svg',
  aurora: 'cosmos/glyph/aurora.svg',
  vacuum: 'cosmos/glyph/vacuum.svg',
  nebula: 'cosmos/glyph/nebula.svg',
  multiverse: 'cosmos/glyph/multiverse.svg',
  maelchaos: 'cosmos/glyph/maelchaos.svg',
  heatDeath: 'cosmos/glyph/heatDeath.svg',
  horizon: 'cosmos/glyph/horizon.svg',
  dimension: 'cosmos/glyph/dimension.svg',
  voidExpanse: 'cosmos/glyph/voidExpanse.svg',
  infiniteRealms: 'cosmos/glyph/infiniteRealms.svg',
  entropyField: 'cosmos/glyph/entropyField.svg',
  voidCollapse: 'cosmos/glyph/voidCollapse.svg',
  cosmicMonarch: 'cosmos/glyph/cosmicMonarch.svg',
  light: 'magic/glyph/light.svg',
  shadow: 'magic/glyph/shadow.svg',
  essence: 'magic/glyph/essence.svg',
  abyss: 'magic/glyph/abyss.svg',
  rift: 'magic/glyph/rift.svg',
  wand: 'magic/glyph/wand.svg',
  curse: 'magic/glyph/curse.svg',
  overcharge: 'magic/glyph/overcharge.svg',
  cataclysm: 'magic/glyph/cataclysm.svg',
  stasis: 'magic/glyph/stasis.svg',
  spark: 'magic/glyph/spark.svg',
  discord: 'magic/glyph/discord.svg',
  anarchy: 'magic/glyph/anarchy.svg',
  extinction: 'magic/glyph/extinction.svg',
  veil: 'magic/glyph/veil.svg',
  shroud: 'magic/glyph/shroud.svg',
  futility: 'magic/glyph/futility.svg',
  purpose: 'magic/glyph/purpose.svg',
  elementalConfluence: 'magic/glyph/elementalConfluence.svg',
  fifthElement: 'magic/glyph/fifthElement.svg',
  elementalRupture: 'magic/glyph/elementalRupture.svg',
  timepiece: 'chronomancy/glyph/timepiece.svg',
  chronomancer: 'chronomancy/glyph/chronomancer.svg',
  paradox: 'chronomancy/glyph/paradox.svg',
  chronosphere: 'chronomancy/glyph/chronosphere.svg',
  eternalLoop: 'chronomancy/glyph/eternalLoop.svg',
  temporalRift: 'chronomancy/glyph/temporalRift.svg',
  chronoWeaver: 'chronomancy/glyph/chronoWeaver.svg',
  reincarnation: 'chronomancy/glyph/reincarnation.svg',
  instant: 'chronomancy/glyph/instant.svg',
  eternity: 'chronomancy/glyph/eternity.svg',
  timeline: 'chronomancy/glyph/timeline.svg',
  temporalSigil: 'chronomancy/glyph/temporalSigil.svg',
  locus: 'chronomancy/glyph/locus.svg',
  timeShard: 'chronomancy/glyph/timeShard.svg',
  chronicle: 'chronomancy/glyph/chronicle.svg',
  forgottenPage: 'chronomancy/glyph/forgottenPage.svg',
  eternalPunishment: 'chronomancy/glyph/eternalPunishment.svg',
  cosmicArchive: 'chronomancy/glyph/cosmicArchive.svg',
  illusion: 'illusion/glyph/illusion.svg',
  mirage: 'illusion/glyph/mirage.svg',
  spectrum: 'illusion/glyph/spectrum.svg',
  parallelWorld: 'illusion/glyph/parallelWorld.svg',
  dreamRealm: 'illusion/glyph/dreamRealm.svg',
  somnium: 'illusion/glyph/somnium.svg',
  selfDeception: 'illusion/glyph/selfDeception.svg',
  phantomMemory: 'illusion/glyph/phantomMemory.svg',
  crossroads: 'illusion/glyph/crossroads.svg',
  forgottenDream: 'illusion/glyph/forgottenDream.svg',
  prophecy: 'illusion/glyph/prophecy.svg',
  afterimage: 'illusion/glyph/afterimage.svg',
  hope: 'emotion/glyph/hope.svg',
  fear: 'emotion/glyph/fear.svg',
  anger: 'emotion/glyph/anger.svg',
  love: 'emotion/glyph/love.svg',
  courage: 'emotion/glyph/courage.svg',
  serenity: 'emotion/glyph/serenity.svg',
  envy: 'emotion/glyph/envy.svg',
  nostalgia: 'emotion/glyph/nostalgia.svg',
  wonder: 'emotion/glyph/wonder.svg',
  pride: 'emotion/glyph/pride.svg',
  compassion: 'emotion/glyph/compassion.svg',
  catharsis: 'emotion/glyph/catharsis.svg',
  whisper: 'sound/glyph/whisper.svg',
  silence: 'sound/glyph/silence.svg',
  cacophony: 'sound/glyph/cacophony.svg',
  harmony: 'sound/glyph/harmony.svg',
  thunderclap: 'sound/glyph/thunderclap.svg',
  reverberation: 'sound/glyph/reverberation.svg',
  lullaby: 'sound/glyph/lullaby.svg',
  warcry: 'sound/glyph/warcry.svg',
  symphony: 'sound/glyph/symphony.svg',
  resonanceOfWorlds: 'sound/glyph/resonanceOfWorlds.svg',
  breath: 'spirit/glyph/breath.svg',
  possession: 'spirit/glyph/possession.svg',
  spellbound: 'spirit/glyph/spellbound.svg',
  exorcism: 'spirit/glyph/exorcism.svg',
  astralForm: 'spirit/glyph/astralForm.svg',
  spiritGuide: 'spirit/glyph/spiritGuide.svg',
  seance: 'spirit/glyph/seance.svg',
  ancestralChorus: 'spirit/glyph/ancestralChorus.svg',
  transcendence: 'spirit/glyph/transcendence.svg',
  animatedFlesh: 'spirit/glyph/animatedFlesh.svg',
  spiritRealm: 'spirit/glyph/spiritRealm.svg',
  soulJar: 'spirit/glyph/soulJar.svg',
  zeal: 'spirit/glyph/seal.svg',
  tears: 'spirit/glyph/tears.svg',
  fading: 'spirit/glyph/fading.svg',
  requiem: 'spirit/glyph/requiem.svg',
  invocation: 'spirit/glyph/invocation.svg',
  geas: 'spirit/glyph/geas.svg',
  celestialBody: 'spirit/glyph/celestialBody.svg',
  spiritVoice: 'spirit/glyph/spiritVoice.svg',
  eternalPrison: 'spirit/glyph/eternalPrison.svg',
  eternalMourning: 'spirit/glyph/eternalMourning.svg',
  betweenWorlds: 'spirit/glyph/betweenWorlds.svg',
  awakenedWill: 'spirit/glyph/awakenedWill.svg',
};
const CAT_GLYPH = {
  starter: 'flame', state: 'wave', nature: 'leaf', metal: 'mountain',
  artifact: 'amphora', entities: 'person', spirit: 'ghost',
  chronomancy: 'hourglass', illusion: 'mask', magic: 'crystal',
  cosmos: 'galaxy', alchemy: 'alembic', emotion: 'heart',
  sound: 'bell', legendary: 'crown',
};
export function kitGlyph(id, size = 14) {
  const p = KIT_GLYPH[id];
  return p ? `<img class="kit-glyph" style="width:${size}px;height:${size}px" src="assets/icons/${p}" alt="">` : null;
}

// Медальоны кита строго по маппингам (elements.json, states.json)
export const KIT_MEDAL = {
  fire: 'elements/fire.svg',
  water: 'elements/water.svg',
  earth: 'elements/earth.svg',
  air: 'elements/air.svg',
  void: 'elements/void.svg',
  spirit: 'elements/spirit.svg',
  matter: 'elements/matter.svg',
  time: 'elements/time.svg',
  space: 'elements/space.svg',
  chaos: 'elements/chaos.svg',
  entropy: 'elements/entropy.svg',
  steam: 'states/steam.svg',
  hotSteam: 'states/hotSteam.svg',
  wetSteam: 'states/wetSteam.svg',
  ice: 'states/ice.svg',
  mist: 'states/mist.svg',
  dust: 'states/dust.svg',
  ash: 'states/ash.svg',
  lava: 'states/lava.svg',
  magma: 'states/magma.svg',
  scoria: 'states/scoria.svg',
  mud: 'states/mud.svg',
  sludge: 'states/sludge.svg',
  storm: 'states/storm.svg',
  inferno: 'states/inferno.svg',
  gale: 'states/gale.svg',
  thunder: 'states/thunder.svg',
  frost: 'states/frost.svg',
  bubble: 'states/bubble.svg',
  echo: 'states/echo.svg',
  wood: 'nature/wood.svg',
  forest: 'nature/forest.svg',
  flower: 'nature/flower.svg',
  life: 'nature/life.svg',
  swamp: 'nature/swamp.svg',
  poison: 'nature/poison.svg',
  moss: 'nature/moss.svg',
  spring: 'nature/spring.svg',
  mountain: 'nature/mountain.svg',
  coral: 'nature/coral.svg',
  vine: 'nature/vine.svg',
  root: 'nature/root.svg',
  mushroom: 'nature/mushroom.svg',
  seed: 'nature/seed.svg',
  spore: 'nature/spore.svg',
  plague: 'nature/plague.svg',
  parasite: 'nature/parasite.svg',
  livingShield: 'nature/livingShield.svg',
  canyon: 'nature/canyon.svg',
  whisperingWinds: 'nature/whisperingWinds.svg',
  maelstrom: 'nature/maelstrom.svg',
  tempest: 'nature/tempest.svg',
  ancientGrove: 'nature/ancientGrove.svg',
  treant: 'nature/treant.svg',
  worldTree: 'nature/worldTree.svg',
  eternalBlight: 'nature/eternalBlight.svg',
  virulentSwarm: 'nature/virulentSwarm.svg',
  primordialStorm: 'nature/primordialStorm.svg',
  chaosStorm: 'nature/chaosStorm.svg',
  mourningGrove: 'nature/mourningGrove.svg',
  plagueStorm: 'nature/plagueStorm.svg',
  erosion: 'nature/erosion.svg',
  decay: 'nature/decay.svg',
  ruin: 'nature/ruin.svg',
  sprout: 'nature/sprout.svg',
  sapling: 'nature/sapling.svg',
  mass: 'nature/mass.svg',
  density: 'nature/density.svg',
  compression: 'nature/compression.svg',
  substance: 'nature/substance.svg',
  bedrock: 'nature/bedrock.svg',
  metal: 'metal/metal.svg',
  steel: 'metal/steel.svg',
  blade: 'metal/blade.svg',
  rust: 'metal/rust.svg',
  stone: 'metal/stone.svg',
  crystal: 'metal/crystal.svg',
  diamond: 'metal/diamond.svg',
  gold: 'metal/gold.svg',
  silver: 'metal/silver.svg',
  iron: 'metal/iron.svg',
  engine: 'metal/engine.svg',
  plasmaBlade: 'metal/plasmaBlade.svg',
  monolith: 'metal/monolith.svg',
  ironWill: 'metal/ironWill.svg',
  forgeHeart: 'metal/forgeHeart.svg',
  absoluteMass: 'metal/absoluteMass.svg',
  copper: 'metal/copper.svg',
  bronze: 'metal/bronze.svg',
  platinum: 'metal/platinum.svg',
  wire: 'metal/wire.svg',
  magnet: 'metal/magnet.svg',
  temperedBlade: 'metal/temperedBlade.svg',
  chainmail: 'metal/chainmail.svg',
  filigree: 'metal/filigree.svg',
  adamant: 'metal/adamant.svg',
  relicBlade: 'metal/relicBlade.svg',
  glass: 'artifact/glass.svg',
  brick: 'artifact/brick.svg',
  ceramic: 'artifact/ceramic.svg',
  clay: 'artifact/clay.svg',
  crown: 'artifact/crown.svg',
  amulet: 'artifact/amulet.svg',
  rune: 'artifact/rune.svg',
  prism: 'artifact/prism.svg',
  mirror: 'artifact/mirror.svg',
  clockwork: 'artifact/clockwork.svg',
  scroll: 'artifact/scroll.svg',
  lantern: 'artifact/lantern.svg',
  key: 'artifact/key.svg',
  shield: 'artifact/shield.svg',
  athanor: 'artifact/athanor.svg',
  philosophersEgg: 'artifact/philosophersEgg.svg',
  vesselOfLife: 'artifact/vesselOfLife.svg',
  hermeticSeal: 'artifact/hermeticSeal.svg',
  furnace: 'artifact/furnace.svg',
  amberRelic: 'artifact/amberRelic.svg',
  auroraCrown: 'artifact/auroraCrown.svg',
  resonator: 'artifact/resonator.svg',
  grimoire: 'artifact/grimoire.svg',
  necronomicon: 'artifact/necronomicon.svg',
  oneirograph: 'artifact/oneirograph.svg',
  possessedArmor: 'artifact/possessedArmor.svg',
  golemCore: 'artifact/golemCore.svg',
  worldAnvil: 'artifact/worldAnvil.svg',
  spatialAnchor: 'artifact/spatialAnchor.svg',
  lighthouse: 'artifact/lighthouse.svg',
  guardian: 'entity/guardian.svg',
  golem: 'entity/golem.svg',
  ghost: 'entity/ghost.svg',
  phoenix: 'entity/phoenix.svg',
  siren: 'entity/siren.svg',
  fairy: 'entity/fairy.svg',
  phantom: 'entity/phantom.svg',
  homunculus: 'entity/homunculus.svg',
  adept: 'entity/adept.svg',
  basilisk: 'entity/basilisk.svg',
  wyvern: 'entity/wyvern.svg',
  leviathan: 'entity/leviathan.svg',
  trickster: 'entity/trickster.svg',
  nemesis: 'entity/nemesis.svg',
  revenant: 'entity/revenant.svg',
  sentinel: 'entity/sentinel.svg',
  banshee: 'entity/banshee.svg',
  lich: 'entity/lich.svg',
  abyssalSovereign: 'entity/abyssalSovereign.svg',
  deathlessWarden: 'entity/deathlessWarden.svg',
  wraithLord: 'entity/wraithLord.svg',
  titan: 'entity/titan.svg',
  chaosBeast: 'entity/chaosBeast.svg',
  voidSpawn: 'entity/voidSpawn.svg',
  rex: 'entity/rex.svg',
  regina: 'entity/regina.svg',
  rebis: 'entity/rebis.svg',
  choirOfSorrow: 'entity/choirOfSorrow.svg',
  fatebreaker: 'entity/fatebreaker.svg',
  willOWisp: 'entity/willOWisp.svg',
  deathKnight: 'entity/deathKnight.svg',
  elementalWarden: 'entity/elementalWarden.svg',
  hollow: 'entity/hollow.svg',
  faithfulFlame: 'entity/faithfulFlame.svg',
  husk: 'entity/husk.svg',
  ardentGuardian: 'entity/ardentGuardian.svg',
  gravewarden: 'entity/gravewarden.svg',
  fatewalker: 'entity/fatewalker.svg',
  worldsmith: 'entity/worldsmith.svg',
  banisher: 'entity/banisher.svg',
  wayfinder: 'entity/wayfinder.svg',
  psychopomp: 'entity/psychopomp.svg',
  philosophersStone: 'legendary/philosophersStone.svg',
  chimera: 'legendary/chimera.svg',
  aurumPotabile: 'legendary/aurumPotabile.svg',
  panacea: 'legendary/panacea.svg',
  animaMundi: 'legendary/animaMundi.svg',
  apocalypse: 'legendary/apocalypse.svg',
  greatBinding: 'legendary/greatBinding.svg',
  masterOfTime: 'legendary/masterOfTime.svg',
  masterOfSpace: 'legendary/masterOfSpace.svg',
  spacetimeContinuum: 'legendary/spacetimeContinuum.svg',
  chaosLord: 'legendary/chaosLord.svg',
  entropyLord: 'legendary/entropyLord.svg',
  oblivion: 'legendary/oblivion.svg',
  potion: 'alchemy/potion.svg',
  acid: 'alchemy/acid.svg',
  pearl: 'alchemy/pearl.svg',
  sand: 'alchemy/sand.svg',
  obsidian: 'alchemy/obsidian.svg',
  fossil: 'alchemy/fossil.svg',
  geyser: 'alchemy/geyser.svg',
  hurricane: 'alchemy/hurricane.svg',
  lightning: 'alchemy/lightning.svg',
  plasma: 'alchemy/plasma.svg',
  death: 'alchemy/death.svg',
  amber: 'alchemy/amber.svg',
  elixir: 'alchemy/elixir.svg',
  catalyst: 'alchemy/catalyst.svg',
  salt: 'alchemy/salt.svg',
  rawSulfur: 'alchemy/rawSulfur.svg',
  rawMercury: 'alchemy/rawMercury.svg',
  sulfurPhil: 'alchemy/sulfurPhil.svg',
  mercuryPhil: 'alchemy/mercuryPhil.svg',
  saltPhil: 'alchemy/saltPhil.svg',
  nigredo: 'alchemy/nigredo.svg',
  albedo: 'alchemy/albedo.svg',
  citrinitas: 'alchemy/citrinitas.svg',
  rubedo: 'alchemy/rubedo.svg',
  azoth: 'alchemy/azoth.svg',
  solve: 'alchemy/solve.svg',
  coagula: 'alchemy/coagula.svg',
  alkahest: 'alchemy/alkahest.svg',
  elixirVitae: 'alchemy/elixirVitae.svg',
  ambrosia: 'alchemy/ambrosia.svg',
  ignition: 'alchemy/ignition.svg',
  coal: 'alchemy/coal.svg',
  briquette: 'alchemy/briquette.svg',
  aetherCore: 'alchemy/aetherCore.svg',
  primeMatter: 'alchemy/primeMatter.svg',
  volatileMatter: 'alchemy/volatileMatter.svg',
  ether: 'cosmos/ether.svg',
  star: 'cosmos/star.svg',
  nova: 'cosmos/nova.svg',
  meteor: 'cosmos/meteor.svg',
  moon: 'cosmos/moon.svg',
  sun: 'cosmos/sun.svg',
  galaxy: 'cosmos/galaxy.svg',
  eclipse: 'cosmos/eclipse.svg',
  quintessence: 'cosmos/quintessence.svg',
  macrocosm: 'cosmos/macrocosm.svg',
  voidRift: 'cosmos/voidRift.svg',
  axis: 'cosmos/axis.svg',
  worldsEnd: 'cosmos/worldsEnd.svg',
  genesis: 'cosmos/genesis.svg',
  axisKeeper: 'cosmos/axisKeeper.svg',
  blackHole: 'cosmos/blackHole.svg',
  singularity: 'cosmos/singularity.svg',
  aurora: 'cosmos/aurora.svg',
  vacuum: 'cosmos/vacuum.svg',
  nebula: 'cosmos/nebula.svg',
  multiverse: 'cosmos/multiverse.svg',
  maelchaos: 'cosmos/maelchaos.svg',
  heatDeath: 'cosmos/heatDeath.svg',
  horizon: 'cosmos/horizon.svg',
  dimension: 'cosmos/dimension.svg',
  voidExpanse: 'cosmos/voidExpanse.svg',
  infiniteRealms: 'cosmos/infiniteRealms.svg',
  entropyField: 'cosmos/entropyField.svg',
  voidCollapse: 'cosmos/voidCollapse.svg',
  cosmicMonarch: 'cosmos/cosmicMonarch.svg',
  light: 'magic/light.svg',
  shadow: 'magic/shadow.svg',
  essence: 'magic/essence.svg',
  abyss: 'magic/abyss.svg',
  rift: 'magic/rift.svg',
  wand: 'magic/wand.svg',
  curse: 'magic/curse.svg',
  overcharge: 'magic/overcharge.svg',
  cataclysm: 'magic/cataclysm.svg',
  stasis: 'magic/stasis.svg',
  spark: 'magic/spark.svg',
  discord: 'magic/discord.svg',
  anarchy: 'magic/anarchy.svg',
  extinction: 'magic/extinction.svg',
  veil: 'magic/veil.svg',
  shroud: 'magic/shroud.svg',
  futility: 'magic/futility.svg',
  purpose: 'magic/purpose.svg',
  elementalConfluence: 'magic/elementalConfluence.svg',
  fifthElement: 'magic/fifthElement.svg',
  elementalRupture: 'magic/elementalRupture.svg',
  timepiece: 'chronomancy/timepiece.svg',
  chronomancer: 'chronomancy/chronomancer.svg',
  paradox: 'chronomancy/paradox.svg',
  chronosphere: 'chronomancy/chronosphere.svg',
  eternalLoop: 'chronomancy/eternalLoop.svg',
  temporalRift: 'chronomancy/temporalRift.svg',
  chronoWeaver: 'chronomancy/chronoWeaver.svg',
  reincarnation: 'chronomancy/reincarnation.svg',
  instant: 'chronomancy/instant.svg',
  eternity: 'chronomancy/eternity.svg',
  timeline: 'chronomancy/timeline.svg',
  temporalSigil: 'chronomancy/temporalSigil.svg',
  locus: 'chronomancy/locus.svg',
  timeShard: 'chronomancy/timeShard.svg',
  chronicle: 'chronomancy/chronicle.svg',
  forgottenPage: 'chronomancy/forgottenPage.svg',
  eternalPunishment: 'chronomancy/eternalPunishment.svg',
  cosmicArchive: 'chronomancy/cosmicArchive.svg',
  illusion: 'illusion/illusion.svg',
  mirage: 'illusion/mirage.svg',
  spectrum: 'illusion/spectrum.svg',
  parallelWorld: 'illusion/parallelWorld.svg',
  dreamRealm: 'illusion/dreamRealm.svg',
  somnium: 'illusion/somnium.svg',
  selfDeception: 'illusion/selfDeception.svg',
  phantomMemory: 'illusion/phantomMemory.svg',
  crossroads: 'illusion/crossroads.svg',
  forgottenDream: 'illusion/forgottenDream.svg',
  prophecy: 'illusion/prophecy.svg',
  afterimage: 'illusion/afterimage.svg',
  hope: 'emotion/hope.svg',
  fear: 'emotion/fear.svg',
  anger: 'emotion/anger.svg',
  love: 'emotion/love.svg',
  courage: 'emotion/courage.svg',
  serenity: 'emotion/serenity.svg',
  envy: 'emotion/envy.svg',
  nostalgia: 'emotion/nostalgia.svg',
  wonder: 'emotion/wonder.svg',
  pride: 'emotion/pride.svg',
  compassion: 'emotion/compassion.svg',
  catharsis: 'emotion/catharsis.svg',
  whisper: 'sound/whisper.svg',
  silence: 'sound/silence.svg',
  cacophony: 'sound/cacophony.svg',
  harmony: 'sound/harmony.svg',
  thunderclap: 'sound/thunderclap.svg',
  reverberation: 'sound/reverberation.svg',
  lullaby: 'sound/lullaby.svg',
  warcry: 'sound/warcry.svg',
  symphony: 'sound/symphony.svg',
  resonanceOfWorlds: 'sound/resonanceOfWorlds.svg',
  breath: 'spirit/breath.svg',
  possession: 'spirit/possession.svg',
  spellbound: 'spirit/spellbound.svg',
  exorcism: 'spirit/exorcism.svg',
  astralForm: 'spirit/astralForm.svg',
  spiritGuide: 'spirit/spiritGuide.svg',
  seance: 'spirit/seance.svg',
  ancestralChorus: 'spirit/ancestralChorus.svg',
  transcendence: 'spirit/transcendence.svg',
  animatedFlesh: 'spirit/animatedFlesh.svg',
  spiritRealm: 'spirit/spiritRealm.svg',
  soulJar: 'spirit/soulJar.svg',
  zeal: 'spirit/seal.svg',
  tears: 'spirit/tears.svg',
  fading: 'spirit/fading.svg',
  requiem: 'spirit/requiem.svg',
  invocation: 'spirit/invocation.svg',
  geas: 'spirit/geas.svg',
  celestialBody: 'spirit/celestialBody.svg',
  spiritVoice: 'spirit/spiritVoice.svg',
  eternalPrison: 'spirit/eternalPrison.svg',
  eternalMourning: 'spirit/eternalMourning.svg',
  betweenWorlds: 'spirit/betweenWorlds.svg',
  awakenedWill: 'spirit/awakenedWill.svg',
};

// Медали категорий по маппингу кита (assets/icons/cat/*.svg)
const CAT_MEDAL = {
  starter: 'stikhii', state: 'sostoyaniya', nature: 'priroda', metal: 'metally',
  artifact: 'artefakty', entities: 'sushchnosti', spirit: 'dukh',
  chronomancy: 'khronomantiya', illusion: 'illyuzii', magic: 'magiya',
  cosmos: 'kosmos', alchemy: 'alkhimiya', emotion: 'chuvstva',
  sound: 'zvuk', legendary: 'legendarnoe',
};

export function alcDivider() {
  const img = document.createElement('img');
  img.className = 'alc-divider';
  img.src = 'assets/ornaments/divider-star.svg';
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  return img;
}

// ─── Drag & gesture state (Pointer Events) ───
const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 300;

let activeGesture = null;
let ghostEl = null;
let tapTimer = null;
let lastTap = null;
let touchDoubleTapFired = false;
let pausedTab = null;

function isOverCanvas(x, y) {
  const open = document.querySelector('.mobile-visible');
  if (open) {
    const pr = open.getBoundingClientRect();
    if (x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom) return false;
  }
  const r = document.getElementById('game-canvas').getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

export function isDraggingElement() {
  return !!(activeGesture && activeGesture.dragging);
}

function createGhost(id) {
  ghostEl = document.createElement('div');
  ghostEl.className = 'drag-ghost';
  ghostEl.innerHTML = KIT_MEDAL[id]
    ? `<img src="assets/icons/${KIT_MEDAL[id]}" alt="" draggable="false" style="width:44px;height:44px">`
    : buildIconSVG(id, 40);
  document.body.appendChild(ghostEl);
}

function moveGhost(x, y) {
  if (ghostEl) {
    ghostEl.style.left = x + 'px';
    ghostEl.style.top = y + 'px';
  }
}

function removeGhost() {
  if (ghostEl) { ghostEl.remove(); ghostEl = null; }
}

export function onItemPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  touchDoubleTapFired = false;
  const item = e.target.closest('.inv-item');
  if (!item) return;
  const id = item.dataset.elementId;
  if (!id || !state.discovered.has(id)) return;
  const el = ELEMENTS[id];
  if (!el) return;

  if (e.pointerType === 'mouse' && e.shiftKey) {
    e.preventDefault();
    showQtyPopup(e, id);
    return;
  }

  activeGesture = {
    pointerId: e.pointerId,
    id,
    item,
    addable: !!(el.starter || el.infinite || (state.inventory[id] || 0) > 0),
    startX: e.clientX,
    startY: e.clientY,
    dragging: false,
    moved: false,
    longPressDone: false,
  };

  if (e.pointerType !== 'mouse') {
    activeGesture.longPressTimer = setTimeout(() => {
      const g = activeGesture;
      if (g && g.pointerId === e.pointerId && !g.dragging) {
        g.longPressDone = true;
        showQtyPopup(e, id);
      }
    }, LONG_PRESS_MS);
  }
}

const invSearch = document.getElementById('inv-search');
if (invSearch && typeof invSearch.addEventListener === 'function') {
  invSearch.addEventListener('input', () => renderInventory());
  invSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { invSearch.value = ''; invSearch.blur(); renderInventory(); }
  });
}
const invSearchClear = document.getElementById('inv-search-clear');
if (invSearch && invSearchClear && typeof invSearchClear.addEventListener === 'function') {
  invSearchClear.addEventListener('click', () => {
    invSearch.value = '';
    // Фокус — только на десктопе: на таче он дёргает вьюпорт и поднимает клавиатуру
    if (window.matchMedia('(pointer: fine)').matches) invSearch.focus();
    else invSearch.blur();
    renderInventory();
  });
}

document.addEventListener('pointermove', (e) => {
  const g = activeGesture;
  if (!g || e.pointerId !== g.pointerId) return;
  // Ручной скролл: палец шёл вертикально — крутим сетку вместо перетаскивания
  if (g.scrolling) {
    const grid = document.getElementById('inventory-grid');
    if (grid) grid.scrollTop -= e.clientY - g.startY;
    g.startX = e.clientX;
    g.startY = e.clientY;
    e.preventDefault();
    return;
  }
  const dx = e.clientX - g.startX;
  const dy = e.clientY - g.startY;
  const threshold = e.pointerType === 'mouse' ? DRAG_THRESHOLD : DRAG_THRESHOLD * 2;
  if (!g.dragging && Math.hypot(dx, dy) > threshold) {
    g.moved = true;
    // Тач идёт строго вертикально — это скролл инвентаря, а не drag
    if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx) * 1.4) {
      g.scrolling = true;
      clearTimeout(g.longPressTimer);
      e.preventDefault();
      return;
    }
    if (!g.addable) return;
    g.dragging = true;
    clearTimeout(g.longPressTimer);
    try { g.item.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
    createGhost(g.id);
    g.item.classList.add('dragging');

    const openPanel = document.querySelector('.mobile-visible');
    if (openPanel && window.innerWidth <= 767) {
      pausedTab = openPanel.id.replace('-panel', '');
      openPanel.classList.remove('mobile-visible');
    }
  }
  if (g.dragging) {
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);
    document.getElementById('game-canvas').classList.toggle('drop-active', isOverCanvas(e.clientX, e.clientY));
  }
});

document.addEventListener('pointerup', (e) => {
  const g = activeGesture;
  if (!g || e.pointerId !== g.pointerId) return;
  clearTimeout(g.longPressTimer);
  const wasDrag = g.dragging;
  const droppedOnCanvas = wasDrag && isOverCanvas(e.clientX, e.clientY);
  g.item.classList.remove('dragging');
  removeGhost();
  document.getElementById('game-canvas').classList.remove('drop-active');
  activeGesture = null;

  if (wasDrag) {
    if (droppedOnCanvas) addToCauldron(g.id, 1);
    if (pausedTab) { switchTab(pausedTab); pausedTab = null; }
    return;
  }

  if (g.longPressDone || g.moved) return;

  // Mouse: single click → info, native dblclick → add 1
  if (e.pointerType === 'mouse') {
    showElementInfo(g.id);
    return;
  }

  // Touch: single tap → info (delayed for double-tap), double tap → add 1
  const now = performance.now();
  if (lastTap && lastTap.id === g.id && now - lastTap.time < DOUBLE_TAP_MS) {
    clearTimeout(tapTimer);
    lastTap = null;
    touchDoubleTapFired = true;
    addToCauldron(g.id, 1);
  } else {
    lastTap = { id: g.id, time: now };
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
      lastTap = null;
      showElementInfo(g.id);
    }, DOUBLE_TAP_MS);
  }
});

document.addEventListener('pointercancel', (e) => {
  const g = activeGesture;
  if (!g || e.pointerId !== g.pointerId) return;
  clearTimeout(g.longPressTimer);
  g.item.classList.remove('dragging');
  removeGhost();
  document.getElementById('game-canvas').classList.remove('drop-active');
  activeGesture = null;
  if (pausedTab) { switchTab(pausedTab); pausedTab = null; }
});

// ─── Quantity popup ───
let qtyPopupElement = null;

export function showQtyPopup(e, elementId) {
  const popup = document.getElementById('qty-popup');
  const btnContainer = popup.querySelector('.qty-buttons');
  btnContainer.innerHTML = '';
  const el = ELEMENTS[elementId];
  const maxQty = el?.starter || el?.infinite ? 9 : Math.min(state.inventory[elementId] || 0, 9);
  if (maxQty <= 0) return;
  for (let i = 1; i <= maxQty; i++) {
    const btn = document.createElement('button');
    btn.className = 'qty-btn';
    btn.textContent = i;
    btn.addEventListener('click', () => { addToCauldron(elementId, i); closeQtyPopup(); });
    btnContainer.appendChild(btn);
  }
  popup.style.display = 'block';
  popup.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
  popup.style.top = Math.min(e.clientY - 60, window.innerHeight - 140) + 'px';
  qtyPopupElement = elementId;
}

export function closeQtyPopup() {
  document.getElementById('qty-popup').style.display = 'none';
  qtyPopupElement = null;
}

export function addToCauldron(id, amount) {
  if (!state.discovered.has(id)) return;
  const el = ELEMENTS[id];
  if (!el) return;
  if (!el.starter && !el.infinite && (!state.inventory[id] || state.inventory[id] < amount)) return;
  const currentTotal = Object.values(state.cauldron).reduce((s, v) => s + v, 0);
  const space = 10 - currentTotal;
  if (space <= 0) {
    log('⚠ Котёл полон (10/10)!', 'info');
    return;
  }
  const addAmt = Math.min(amount, space);
  state.cauldron[id] = (state.cauldron[id] || 0) + addAmt;
  state.cauldronEntryTime[id] = performance.now();
  if (!el.starter && !el.infinite) state.inventory[id] -= addAmt;
  playDrop();
  updateUI();
}

// ─── Inventory ───
let elementInfoActive = null;

export function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';

  if (!window._sortMode) window._sortMode = 'category';
  const sortToggle = document.createElement('div');
  sortToggle.className = 'inv-full-row';
  sortToggle.style.cssText = 'width:100%;text-align:center;margin-bottom:4px;font-size:15px;color:#77779a;cursor:pointer;padding:4px;border-radius:4px';
  sortToggle.title = 'Переключить сортировку';
  sortToggle.innerHTML = window._sortMode === 'category'
    ? '<img class="sec-ico" style="width:20px;height:20px" src="assets/icons/glyph/sort-cat.svg" alt="">По категориям'
    : '<img class="sec-ico" style="width:20px;height:20px" src="assets/icons/glyph/sort-alpha.svg" alt="">По алфавиту';
  sortToggle.addEventListener('click', () => {
    window._sortMode = window._sortMode === 'category' ? 'alpha' : 'category';
    renderInventory();
  });
  grid.appendChild(sortToggle);

  const discovered = ELEMENT_IDS.filter(id => state.discovered.has(id));
  const undiscovered = ELEMENT_IDS.filter(id => !state.discovered.has(id));
  const searchInput = document.getElementById('inv-search');
  const q = (searchInput && searchInput.value || '').trim().toLowerCase();

  if (q) {
    discovered.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
    discovered.filter(id => ELEMENTS[id].name.toLowerCase().includes(q)).forEach(id => renderItem(grid, id));
    return;
  }

  if (window._sortMode === 'category') {
    CAT_ORDER.forEach(cat => {
      const ids = discovered.filter(id => ELEMENT_CATS[id] === cat);
      if (ids.length === 0) return;
      const catInfo = CATEGORIES[cat];
      const header = document.createElement('div');
      header.className = 'inv-full-row inv-cat-header';
      header.style.cssText = `width:100%;font-size:9px;color:${catInfo.color};padding:4px 2px 2px;border-bottom:1px solid ${hexRgba(catInfo.color, 0.13)};margin-top:0;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:4px`;
      header.innerHTML = `${CAT_MEDAL[cat] ? `<img class="cat-medal" src="assets/icons/cat/${CAT_MEDAL[cat]}.svg" alt="">` : ''}<span>${catInfo.label}</span>`;
      grid.appendChild(header);
      ids.forEach(id => renderItem(grid, id));
    });
  } else {
    discovered.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
    discovered.forEach(id => renderItem(grid, id));
  }

  // Пустышки «?» больше не рисуем: 300+ слотов давали огромный скролл и лаги на мобилке.
  // Вместо них — одна строка-итог в самом низу списка (видна только при прокрутке до конца).
  if (undiscovered.length > 0 && !q) {
    const more = document.createElement('div');
    more.className = 'inv-full-row inv-more';
    more.innerHTML = `<img class="sec-ico" src="assets/icons/glyph/question.svg" alt="">Неоткрыто: ${undiscovered.length} — смешивай элементы`;
    more.title = 'Новые элементы откроются смешиванием';
    grid.appendChild(more);
  }
}

// ─── Tooltip ───
let tooltipTimer = null;

function showTooltip(id, e) {
  const el = ELEMENTS[id];
  if (!el || !state.discovered.has(id)) return;
  clearTimeout(tooltipTimer);
  const tip = document.getElementById('tooltip');
  const cat = ELEMENT_CATS[id];
  const catInfo = CATEGORIES[cat];
  const qty = state.inventory[id] || 0;
  const isFinal = FINAL_IDS.includes(id);
  tip.innerHTML = `
    <div class="tt-header">
      ${kitGlyph(id, 16) || buildIconSVG(id, 16)}
      <span class="tt-name">${el.name}</span>
    </div>
    <div class="tt-cat">${catInfo ? catInfo.label : ''}${isFinal ? ' · 🏁 финал' : ''}</div>
    <div class="tt-desc">${el.desc}</div>
    ${isFinal ? '<div class="tt-final" title="Из этого элемента ничего не крафтится — можно не пробовать">🏁 Финальный: ни во что не входит</div>' : ''}
    <div class="tt-qty">${el.starter || el.infinite ? '<img class="sec-ico" src="assets/icons/glyph/infinity.svg" alt=""> в запасе' : 'В наличии: ' + qty}</div>
  `;
  tip.style.display = 'block';
  positionTooltip(e);
}

function hideTooltip() {
  clearTimeout(tooltipTimer);
  document.getElementById('tooltip').style.display = 'none';
}

function positionTooltip(e) {
  const tip = document.getElementById('tooltip');
  let x = e.clientX + 14;
  let y = e.clientY + 14;
  const rect = tip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - 14;
  if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - 14;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

function renderItem(grid, id) {
  const el = ELEMENTS[id];
  const discovered = state.discovered.has(id);
  const qty = state.inventory[id] || 0;
  const item = document.createElement('div');
  item.className = 'inv-item' + (discovered ? '' : ' undiscovered');
  item.dataset.elementId = id;

  if (discovered) {
    if (id === state.pendingReveal) {
      item.style.background = 'linear-gradient(135deg, rgba(90,90,130,0.25), rgba(60,60,90,0.08))';
      item.style.borderColor = 'rgba(160,160,190,0.35)';
      const iconDiv = document.createElement('div');
      iconDiv.className = 'icon-container';
      iconDiv.innerHTML = '<img src="assets/icons/glyph/unknown.svg" alt="" style="width:28px;height:28px">';
      iconDiv.style.lineHeight = '32px';
      item.appendChild(iconDiv);
      const label = document.createElement('div');
      label.className = 'name-label';
      label.textContent = '???';
      item.appendChild(label);
      grid.appendChild(item);
      return;
    }
    item.style.background = `linear-gradient(135deg, ${hexRgba(el.color, 0.27)}, ${hexRgba(el.color, 0.07)})`;
    item.style.borderColor = hexRgba(el.color, 0.4);
    if (id === 'void') {
      item.style.borderColor = '#9B5FCF';
      item.style.boxShadow = '0 0 12px rgba(123,63,175,0.4), inset 0 0 8px rgba(123,63,175,0.15)';
    }
    if (id === 'abyss') {
      item.style.borderColor = '#4A00AA';
      item.style.boxShadow = '0 0 10px rgba(74,0,170,0.3)';
    }
    const tier = TIER[id] || 'normal';
    if (tier !== 'normal') item.classList.add('tier-' + tier);
    const iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    iconDiv.innerHTML = KIT_MEDAL[id]
      ? `<img class="kit-medal" src="assets/icons/${KIT_MEDAL[id]}" alt="${el.name}">`
      : buildIconSVG(id);
    item.appendChild(iconDiv);
    const qtyEl = document.createElement('div');
    qtyEl.className = 'quantity';
    if (el.starter || el.infinite) {
      qtyEl.innerHTML = '<img src="assets/icons/glyph/infinity.svg" alt="∞" style="width:11px;height:11px">';
    } else {
      qtyEl.textContent = qty;
    }
    if (qty > 0 || el.starter || el.infinite) item.appendChild(qtyEl);
    const label = document.createElement('div');
    label.className = 'name-label';
    label.textContent = el.name;
    item.appendChild(label);
    if (FINAL_IDS.includes(id)) {
      const fin = document.createElement('div');
      fin.className = 'final-mark';
      fin.innerHTML = '<img src="assets/icons/glyph/flag.svg" alt="">';
      fin.title = 'Финальный элемент — ни во что не входит';
      item.appendChild(fin);
    }
    item.addEventListener('pointerdown', onItemPointerDown);
    item.addEventListener('dblclick', (e) => {
      if (touchDoubleTapFired) { touchDoubleTapFired = false; return; }
      e.preventDefault();
      addToCauldron(id, 1);
    });
    item.addEventListener('mouseenter', (e) => { showTooltip(id, e); });
    item.addEventListener('mouseleave', hideTooltip);
    item.addEventListener('mousemove', positionTooltip);
  } else {
    const q = document.createElement('div');
    q.textContent = '?';
    q.style.cssText = 'font-size:20px;color:#2a2a4e;';
    item.appendChild(q);
  }
  grid.appendChild(item);
}

// ─── Element Info / Recipe Book ───
export function showElementInfo(id) {
  const el = ELEMENTS[id];
  if (!el || !state.discovered.has(id)) return;
  if (window.innerWidth <= 767) switchTab('recipes');
  elementInfoActive = id;

  const list = document.getElementById('recipes-list');
  list.innerHTML = '';
  const panelTitle = document.querySelector('#recipes-panel .panel-title');
  panelTitle.innerHTML = `<a href="#" onclick="hideElementInfo();return false" style="color:#ffd700;text-decoration:none;margin-right:6px">←</a> ${el.name}`;

  const header = document.createElement('div');
  header.style.cssText = 'text-align:center;padding:8px;margin-bottom:6px;border-bottom:1px solid rgba(42,42,78,0.27)';
  const wrapCls = 'card-icon-wrap' + (id === 'void' ? ' void' : id === 'abyss' ? ' abyss' : '');
  const wrapStyle = `background:linear-gradient(135deg, ${hexRgba(el.color, 0.27)}, ${hexRgba(el.color, 0.07)});` + (id === 'void' || id === 'abyss' ? '' : `border-color:${hexRgba(el.color, 0.4)}`);
  const cat = ELEMENT_CATS[id];
  const catInfo = CATEGORIES[cat];
  const qtyHave = el.starter || el.infinite ? '<img class="sec-ico" src="assets/icons/glyph/infinity.svg" alt=""> в запасе' : `×${state.inventory[id] || 0} в наличии`;
  header.innerHTML = `<div style="text-align:center;margin:0 auto 6px"><span class="${wrapCls}" style="${wrapStyle}">${KIT_MEDAL[id] ? `<img class="head-medal" src="assets/icons/${KIT_MEDAL[id]}" alt="${el.name}">` : buildIconSVG(id, 44)}</span></div><div style="font-size:13.5px;font-weight:bold;color:#fff">${el.name}</div><div style="font-size:12px;color:#a8a8c2;margin-top:2px">${el.desc}</div><div style="font-size:11.5px;color:#ffd700aa;margin-top:3px">${catInfo ? catInfo.label : ''} · ${qtyHave}</div>`;
  list.appendChild(header);

  const knownKeys = new Set(notebook.knownRecipes);
  const producing = RECIPES.filter(r => r.output === id && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
  if (producing.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:6px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = `Получается из: ${producing.length}`;
    list.appendChild(title);
    producing.forEach(r => {
      const key = recipeKey(r);
      const isFound = state.foundRecipes.has(key);
      const isKnown = !isFound && knownKeys.has(key);
      const formula = r.inputs.map(i => `<span class="recipe-ing" style="color:${textSafeColor(ELEMENTS[i.id]?.color || '#888')}">${kitGlyph(i.id, 13) || buildIconSVG(i.id, 13)}${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
      const entry = document.createElement('div');
      entry.className = 'recipe-entry ' + (isFound ? 'found' : 'known');
      entry.style.marginBottom = '2px';
      if (isKnown) entry.title = 'Раскрыто жертвой — засчитается после реального крафта';
      entry.innerHTML = `${isKnown ? '<img class="sec-ico" src="assets/icons/glyph/crystal.svg" alt="" title="Раскрыто жертвой">' : ''}<span class="recipe-formula">${formula}</span>`;
      list.appendChild(entry);
    });
  } else if (!el.starter) {
    const none = document.createElement('div');
    none.style.cssText = 'font-size:10px;color:#555;margin:4px 0';
    none.textContent = 'Рецепт ещё не открыт';
    list.appendChild(none);
    const gBtn = document.createElement('button');
    gBtn.style.cssText = 'margin-top:6px;width:100%;background:#1a1a2e;border:1px solid #ffd70055;border-radius:4px;color:#ffd700;padding:5px;font-size:11px;cursor:pointer';
    gBtn.innerHTML = '<img class="sec-ico" src="assets/icons/elements/star.svg" alt="">Узнать в Гримуаре';
    gBtn.title = `Открыть ритуал для «${el.name}»`;
    gBtn.addEventListener('click', () => openGrimoire(id));
    list.appendChild(gBtn);
  }

  const usedIn = RECIPES.filter(r => r.inputs.some(i => i.id === id) && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
  if (usedIn.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:8px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = `Можно создать: ${usedIn.length}`;
    list.appendChild(title);
    usedIn.forEach(r => {
      const key = recipeKey(r);
      const isFound = state.foundRecipes.has(key);
      const isKnown = !isFound && knownKeys.has(key);
      const output = ELEMENTS[r.output];
      const others = r.inputs.filter(i => i.id !== id);
      const coFormula = others.length > 0
        ? others.map(i => `<span style="color:${textSafeColor(ELEMENTS[i.id]?.color || '#888')}">${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ') + ' + '
        : '';
      const entry = document.createElement('div');
      entry.className = 'recipe-entry clickable ' + (isFound ? 'found' : 'known');
      entry.style.marginBottom = '2px';
      entry.title = state.discovered.has(r.output) ? `Открыть: ${output ? output.name : r.output}` : '';
      entry.innerHTML = `${kitGlyph(r.output, 18) || buildIconSVG(r.output, 18)}<span class="recipe-formula">${coFormula}</span><span class="recipe-arrow">→</span> <span class="recipe-result" style="color:${textSafeColor(output ? output.color : '#888')}">${output ? output.name : r.output}</span>${isKnown ? ' <img class="sec-ico" src="assets/icons/glyph/crystal.svg" alt="" title="Раскрыто жертвой">' : ''}`;
      if (state.discovered.has(r.output)) {
        entry.addEventListener('click', () => showElementInfo(r.output));
      }
      list.appendChild(entry);
    });
  }

  if (FINAL_IDS.includes(id)) {
    const fin = document.createElement('div');
    fin.className = 'final-note';
    fin.title = 'Из этого элемента ничего не крафтится — можно не пробовать';
    fin.textContent = 'Финальный элемент — ни во что не входит, время на пробы не тратьте';
    list.appendChild(fin);
  }

  if (producing.length === 0 && usedIn.length === 0 && !el.starter) {
    const none = document.createElement('div');
    none.style.cssText = 'font-size:10px;color:#555;text-align:center;padding:10px';
    none.textContent = 'Нет открытых рецептов';
    list.appendChild(none);
  }

  const maxAdd = el.starter || el.infinite ? 9 : Math.min(state.inventory[id] || 0, 9);
  if (maxAdd > 0) {
    const addSection = document.createElement('div');
    addSection.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid #2a2a4e44';
    const addLabel = document.createElement('div');
    addLabel.style.cssText = 'font-size:10px;color:#a8a8c2;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px';
    addLabel.innerHTML = '<img class="sec-ico" src="assets/icons/glyph/add.svg" alt="">Добавить в котёл:';
    addSection.appendChild(addLabel);
    const btnRow = document.createElement('div');
    btnRow.className = 'el-add-row';
    for (let i = 1; i <= maxAdd && i <= 5; i++) {
      const btn = document.createElement('button');
      btn.textContent = `×${i}`;
      btn.title = `Добавить ${i} шт. в котёл`;
      btn.addEventListener('click', () => { addToCauldron(id, i); hideElementInfo(); });
      btnRow.appendChild(btn);
    }
    addSection.appendChild(btnRow);
    list.appendChild(addSection);
  }

  const treeBtn = document.createElement('button');
  treeBtn.className = 'el-tree-btn';
  treeBtn.innerHTML = '<img class="sec-ico" src="assets/icons/glyph/map.svg" alt="">Древо рецептов';
  treeBtn.title = `Открыть древо: ${el.name}`;
  treeBtn.addEventListener('click', () => { openTree(id); });
  list.appendChild(treeBtn);
}

export function hideElementInfo() {
  elementInfoActive = null;
  const panelTitle = document.querySelector('#recipes-panel .panel-title');
  panelTitle.textContent = 'Книга рецептов';
  renderRecipes();
}

export function renderRecipes() {
  const list = document.getElementById('recipes-list');
  list.innerHTML = '';
  const knownKeys = new Set(notebook.knownRecipes);
  const foundAny = RECIPES.some(r => state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r)));
  if (!foundAny) {
    const empty = document.createElement('div');
    empty.className = 'recipes-empty';
    empty.textContent = '🔒 Рецепты будут открываться по мере смешивания';
    list.appendChild(empty);
    return;
  }
  RECIPES.forEach(r => {
    const key = recipeKey(r);
    const isFound = state.foundRecipes.has(key);
    const isKnown = !isFound && knownKeys.has(key);
    if (!isFound && !isKnown) return;
    const output = ELEMENTS[r.output];
    const entry = document.createElement('div');
    entry.className = 'recipe-entry ' + (isFound ? 'found' : 'known');
    const formula = r.inputs.map(i => `<span style="color:${textSafeColor(ELEMENTS[i.id]?.color || '#888')}">${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
    if (isKnown) entry.title = 'Раскрыто жертвой — засчитается после реального крафта';
    entry.innerHTML = `${isKnown ? '<img class="sec-ico" src="assets/icons/glyph/crystal.svg" alt="" title="Раскрыто жертвой">' : ''}<span class="recipe-formula">${formula}</span><span class="recipe-arrow">→</span><span class="recipe-result" style="color:${textSafeColor(output ? output.color : '#888')}">${output ? output.name : r.output}</span>${r.ratio ? `<div class="recipe-dominance-hint">${ELEMENTS[r.ratio.id]?.name || r.ratio.id} преобладает</div>` : ''}`;
    list.appendChild(entry);
  });
}

// ─── Log ───
const LOG_DEDUP_MS = 8000;
export function log(text, type = 'info') {
  // Журнал без эмодзи: смысл несёт цвет типа, иконки живут в UI кита
  text = String(text).replace(/^(\p{Extended_Pictographic}\uFE0F?\s*)+/u, '');
  // Троттлинг одинаковых подряд (напр. «Облачный прогресс применён» пуллом и фокусом)
  const prev = state.messages[state.messages.length - 1];
  if (prev && prev.text === text && prev.type === type && Date.now() - prev.time < LOG_DEDUP_MS) return;
  state.messages.push({ text, type, time: Date.now() });
  const content = document.getElementById('log-content');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.textContent = text;
  content.appendChild(entry);
  content.scrollTop = content.scrollHeight;
  if (state.messages.length > 100) { state.messages.shift(); if (content.children.length > 100) content.removeChild(content.firstChild); }
}

// ─── UI Update ───
export function updateUI() {
  renderInventory();
  if (!elementInfoActive) renderRecipes();
  updateStats();
  updateCauldronIndicator();
  saveGame();
}

function updateStats() {
  document.getElementById('discovered-count').textContent = state.discovered.size;
  document.getElementById('total-count').textContent = ELEMENT_IDS.length;
  document.getElementById('recipe-count').textContent = state.foundRecipes.size;
  document.getElementById('ach-count').textContent = state.achievements.size;
  const fill = document.getElementById('hprog-fill');
  if (fill) fill.style.width = (ELEMENT_IDS.length ? Math.round((state.discovered.size / ELEMENT_IDS.length) * 100) : 0) + '%';
}

export function updateCauldronIndicator() {
  const indicator = document.getElementById('cauldron-indicator');
  const entries = Object.entries(state.cauldron);
  if (entries.length === 0) {
    indicator.innerHTML = 'Котёл пуст · вместимость 10';
  } else {
    const parts = entries.map(([id, qty]) => `<span class="cauldron-item-qty">${id === state.pendingReveal ? '<img src="assets/icons/glyph/unknown.svg" alt="" style="width:14px;height:14px">' : (kitGlyph(id, 14) || buildIconSVG(id, 14))} ${id === state.pendingReveal ? '???' : ELEMENTS[id].name} <b>×${qty}</b></span>`);
    indicator.innerHTML = parts.join(' ');
    const types = Object.keys(state.cauldron).sort();
    if (types.length > 1 && state.triedPairs.has(types.join('+'))) {
      const warn = document.createElement('span');
      warn.className = 'tried-warning';
      warn.innerHTML = '<img class="sec-ico" src="assets/icons/glyph/warning.svg" alt="">Эту комбинацию уже пробовали — возможен взрыв';
      indicator.appendChild(warn);
    }
  }
}

// ─── Whisper toast ───
let whisperToastTimer = null;

const TOAST_ICON = '<img class="toast-ico" src="assets/icons/glyph/openbook.svg" alt="">';

export function showWhisperToast(mode = 'solved') {
  const toast = document.getElementById('whisper-toast');
  if (!toast) return;
  const title = toast.querySelector('.whisper-toast-title');
  const desc = toast.querySelector('.whisper-toast-desc');
  if (mode === 'new') {
    if (title) title.innerHTML = `${TOAST_ICON}Новый шёпот`;
    if (desc) desc.textContent = 'Хаос шепчет — откройте Гримуар, чтобы прочесть намёк';
  } else {
    if (title) title.innerHTML = `${TOAST_ICON}Загадка из книжки разгадана`;
    if (desc) desc.textContent = 'Откройте Гримуар, чтобы прочесть намёк';
  }
  toast.classList.add('show');
  clearTimeout(whisperToastTimer);
  whisperToastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ─── Grimoire (notebook) ───
export function updateNotebookBadge() {
  const badge = document.getElementById('notebook-badge');
  if (!badge) return;
  const n = notebook.entries.filter(e => e.type === 'whisper' && !e.resolved).length;
  if (notebook.hasUnseen && n > 0) {
    badge.textContent = n > 9 ? '9+' : n;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

export function openGrimoire(presetTargetId = null) {
  lastSacrificeReveal = null;
  grimoirePresetTarget = presetTargetId;
  renderNotebook();
  notebook.hasUnseen = false;
  saveNotebook();
  updateNotebookBadge();
  openModalAnimated(document.getElementById('grimoire-modal'));
  if (presetTargetId) {
    requestAnimationFrame(() => {
      const box = document.querySelector('#notebook-content .sacrifice-box');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

export function closeGrimoire(e) {
  if (e && e.target !== e.currentTarget) return;
  lastSacrificeReveal = null;
  closeModalAnimated('grimoire-modal');
}

const SOURCE_ICONS = {
  ambient: '<img class="sec-ico" src="assets/icons/glyph/question.svg" alt="">',
  oracle: '<img class="sec-ico" src="assets/icons/glyph/crystal.svg" alt="">',
  prophecy: '<img class="sec-ico" src="assets/icons/glyph/sparkles.svg" alt="">',
};

function renderNotebook() {
  const content = document.getElementById('notebook-content');
  content.innerHTML = '';
  const unresolved = notebook.entries.filter(e => e.type === 'whisper' && !e.resolved);

  if (unresolved.length > 0) {
    const title = document.createElement('div');
    title.className = 'nb-section-title';
    title.textContent = `❓ Неразгаданные шёпоты (${unresolved.length}/4)`;
    content.appendChild(title);
    if (unresolved.length >= 4) {
      const cap = document.createElement('div');
      cap.className = 'sacrifice-hint';
      cap.textContent = 'Новых шёпотов не будет, пока не разгадаешь старые — старые со временем становятся точнее.';
      content.appendChild(cap);
    }
    const SOURCE_LABEL = { ambient: 'шёпот', oracle: 'оракул', prophecy: 'пророчество' };
    const STAGE_ROMAN = ['I', 'II', 'III'];
    unresolved.forEach(e => {
      const row = document.createElement('div');
      row.className = `nb-entry nb-whisper unresolved ${e.source || 'ambient'}`;
      const stage = STAGE_ROMAN[Math.min(Math.max(e.stage || 1, 1), 3) - 1];
      row.innerHTML = `<span class="nb-icon nb-seal nb-seal-whisper">${SOURCE_ICONS[e.source] || '<img class="sec-ico" src="assets/icons/glyph/question.svg" alt="">'}</span>` +
        `<span class="nb-lore-body"><span class="nb-meta"><span class="nb-tier">${SOURCE_LABEL[e.source] || 'шёпот'} · ${stage} ступень</span></span>` +
        `<span class="nb-text">${renderWhisperText(e)}</span></span>`;
      row.title = 'Разгадай — смешай то, на что намекает шёпот';
      content.appendChild(row);
    });
  }

  renderLegendarySection(content);

  renderSacrificeSection(content);
}

// ─── Legendary section ───
const NAME_REVEAL_THRESHOLD = 0.6;
const MAX_CHAIN_HINTS = 4;
let legendSnapshot = null;

function getLegendProgressInfo(id) {
  const recipes = RECIPES.filter(r => r.output === id);
  if (recipes.length === 0) return { lines: ['Тайна откроется по мере ваших открытий'], progress: null, tier: 1, total: 0, knownCount: 0, ratio: 0 };
  let best = null;
  for (const r of recipes) {
    const distinct = [...new Set(r.inputs.map(i => i.id))];
    const known = distinct.filter(i => state.discovered.has(i));
    const progress = known.length / distinct.length;
    if (!best || progress > best.progress) best = { distinct, known, progress };
  }
  const total = best.distinct.length;
  const knownCount = best.known.length;
  const ratio = knownCount / total;
  const lines = [];
  let tier;

  if (ratio >= 1) {
    tier = 4;
    lines.push('Все составляющие собраны — отправляйтесь к котлу');
  } else if (ratio === 0) {
    tier = 1;
    lines.push(`Нужны редкие составляющие (${total}). Открывайте новые элементы — подсказки появятся сами`);
  } else {
    tier = 2;
    const counts = {};
    best.distinct.forEach(i => {
      const cat = ELEMENT_CATS[i];
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const summary = Object.entries(counts)
      .map(([cat, n]) => `${getCategoryLabel(cat)} ×${n}`)
      .join(', ');
    lines.push(`Требуется ${total} составляющих: ${summary}`);
    if (ratio >= NAME_REVEAL_THRESHOLD || total - knownCount <= 1) {
      tier = 3;
      const missing = best.distinct.filter(i => !state.discovered.has(i));
      lines.push(`Не хватает: ${missing.map(i => ELEMENTS[i].name).join(', ')}`);
      missing.slice(0, MAX_CHAIN_HINTS).forEach(i => {
        const sub = RECIPES.find(r => r.output === i);
        if (!sub) return;
        const subCats = [...new Set(sub.inputs.map(inp => getCategoryHint(inp.id)))];
        lines.push(`${ELEMENTS[i].name}: создаётся из «${subCats.join('», «')}»`);
      });
    }
  }

  const progress = ratio > 0 && ratio < 1 ? `${knownCount}/${total}` : null;
  return { lines, progress, tier, total, knownCount, ratio };
}

const LEGEND_TIER_LABEL = { 1: 'тайна', 2: 'след', 3: 'близко', 4: 'готово' };

function renderLegendarySection(content) {
  const foundCount = LEGENDARY_IDS.filter(id => state.discovered.has(id)).length;
  content.appendChild(alcDivider());
  const title = document.createElement('div');
  title.className = 'nb-section-title';
  title.innerHTML = `<img class="sec-ico" src="assets/icons/glyph/crown.svg" alt="">Легенды <span class="nb-count">${foundCount}/${LEGENDARY_IDS.length}</span>`;
  content.appendChild(title);

  // Ближайшие к открытию — сверху, найденные — первыми
  const ordered = [...LEGENDARY_IDS].sort((a, b) => {
    const fa = state.discovered.has(a) ? 1 : 0, fb = state.discovered.has(b) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const ia = getLegendProgressInfo(a), ib = getLegendProgressInfo(b);
    if (ia.tier !== ib.tier) return ib.tier - ia.tier;
    return (ib.ratio || 0) - (ia.ratio || 0);
  });

  ordered.forEach(id => {
    const el = ELEMENTS[id];
    if (!el) return;
    const found = state.discovered.has(id);
    const row = document.createElement('div');
    if (found) {
      row.className = 'nb-entry nb-legend found';
      row.innerHTML = `<span class="nb-icon nb-seal">${KIT_MEDAL[id] ? `<img src="assets/icons/${KIT_MEDAL[id]}" alt="${el.name}">` : buildIconSVG(id, 40)}</span>
        <span class="nb-lore-body"><span class="nb-lore-name">${el.name} <span class="nb-stars">★★★</span></span><span class="nb-lore-desc">${el.desc}</span></span>
        <span class="nb-target">✔</span>`;
    } else {
      const { lines, progress, tier, total, ratio } = getLegendProgressInfo(id);
      row.className = `nb-entry nb-legend locked t${tier}` + (tier >= 3 ? ' near' : '');
      const hintHtml = lines.map(l => `<span class="nb-hint">${l}</span>`).join('');
      const pct = Math.round((ratio || 0) * 100);
      const icon = `<img class="sec-ico" src="assets/icons/glyph/${tier >= 4 ? 'key' : tier === 3 ? 'magnify' : 'lock'}.svg" alt="">`;
      row.innerHTML = `<span class="nb-icon nb-seal">${icon}</span>
        <span class="nb-lore-body"><span class="nb-lore-name">${el.name}</span><span class="nb-meta"><span class="nb-tier">${tier >= 4 ? '<img class="sec-ico" src="assets/icons/glyph/key.svg" alt="">' : tier === 3 ? '<img class="sec-ico" src="assets/icons/glyph/magnify.svg" alt="">' : ''}${LEGEND_TIER_LABEL[tier] || ''}</span>${total ? `<span class="nb-need"><img class="sec-ico" src="assets/icons/glyph/gem.svg" alt="">${total}</span>` : ''}</span>${hintHtml}<span class="nb-bar"><i style="width:${pct}%"></i></span></span>
        ${progress !== null ? `<span class="nb-progress">${progress}</span>` : ''}`;
    }
    content.appendChild(row);
  });
}

// ─── Legend progress toasts ───
export function initLegendSnapshot() {
  const snap = {};
  LEGENDARY_IDS.forEach(id => {
    if (state.discovered.has(id)) return;
    const info = getLegendProgressInfo(id);
    snap[id] = info.tier + ':' + (info.progress || 'done');
  });
  legendSnapshot = snap;
}

export function checkLegendProgress() {
  if (!legendSnapshot) initLegendSnapshot();
  const improved = [];
  LEGENDARY_IDS.forEach(id => {
    if (state.discovered.has(id)) return;
    const info = getLegendProgressInfo(id);
    const sig = info.tier + ':' + (info.progress || 'done');
    if (legendSnapshot[id] !== undefined && legendSnapshot[id] !== sig) {
      improved.push({ id, info });
    }
    legendSnapshot[id] = sig;
  });
  if (improved.length === 0) return;
  improved
    .sort((a, b) => b.info.tier - a.info.tier)
    .slice(0, 2)
    .forEach((item, i) => setTimeout(() => showLegendToast(item), i * 300));
}

let legendToastTimer = null;

function showLegendToast({ id, info }) {
  const el = ELEMENTS[id];
  const toast = document.getElementById('legend-toast');
  if (!toast || !el) return;
  const title = toast.querySelector('.legend-toast-title');
  const desc = toast.querySelector('.legend-toast-desc');
  if (title) title.innerHTML = `<img class="toast-ico" src="assets/icons/glyph/flask-red.svg" alt="">Шаг к ${el.name}`;
  if (desc) {
    desc.textContent = info.tier >= 3
      ? (info.lines.find(l => l.startsWith('Не хватает')) || info.lines[0])
      : (info.progress ? `Открыто ${info.progress} составляющих` : info.lines[0]);
  }
  toast.classList.add('show');
  clearTimeout(legendToastTimer);
  legendToastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── Sacrifice ritual ───
let sacrificeRolledRecipe = null;
let lastSacrificeReveal = null;
let grimoirePresetTarget = null;

function getSacrificeTargets() {
  return ELEMENT_IDS.filter(id => {
    const el = ELEMENTS[id];
    if (!el || el.starter || el.infinite) return false;
    if (!state.discovered.has(id)) return false;
    return getRemainingRecipes(id).length > 0;
  });
}

function getSacrificeDonors() {
  return ELEMENT_IDS.filter(id => {
    const el = ELEMENTS[id];
    if (!el) return false;
    if (!state.discovered.has(id)) return false;
    if (!canSacrifice(id)) return false;
    return (state.inventory[id] || 0) >= 1;
  });
}

function buildSacrificeDonors(donorSelect, recipe) {
  donorSelect.innerHTML = '';
  const donors = getSacrificeDonors();
  donors.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
  const cost = recipe ? getRevealCost(recipe) : 0;
  donors.forEach(id => {
    const el = ELEMENTS[id];
    const qty = state.inventory[id] || 0;
    const required = recipe ? getRequiredAmount(recipe, id) : 0;
    const opt = document.createElement('option');
    opt.value = id;
    const enough = !recipe || required <= qty;
    opt.textContent = enough
      ? `${el.name} ×${qty}`
      : `${el.name} ×${qty} (нужно ${required})`;
    opt.disabled = !enough;
    donorSelect.appendChild(opt);
  });
  if (donors.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = '— нет доноров —';
    opt.disabled = true;
    donorSelect.appendChild(opt);
  }
  return cost;
}

function renderSacrificeSection(content) {
  content.appendChild(alcDivider());
  const title = document.createElement('div');
  title.className = 'nb-section-title';
  title.innerHTML = '<img class="sec-ico" src="assets/icons/glyph/flame.svg" alt="">Жертвенный ритуал';
  content.appendChild(title);

  const targets = getSacrificeTargets();
  const donors = getSacrificeDonors();

  if (targets.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'sacrifice-hint';
    hint.textContent = 'Нет целей: все известные вам элементы уже раскрыты в книге рецептов.';
    content.appendChild(hint);
    return;
  }
  if (donors.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'sacrifice-hint';
    hint.textContent = 'Нечего принести в жертву — нужно не менее двух единиц какого-либо элемента.';
    content.appendChild(hint);
    return;
  }

  const box = document.createElement('div');
  box.className = 'sacrifice-box';

  // Алтарь-превью: цель 🔥 жертва + прогресс цели
  const altar = document.createElement('div');
  altar.className = 'sacrifice-altar';
  const tSide = document.createElement('div');
  tSide.className = 'sacrifice-side s-target';
  const dSide = document.createElement('div');
  dSide.className = 'sacrifice-side s-donor';
  const fire = document.createElement('div');
  fire.className = 'sacrifice-fire';
  fire.innerHTML = '<img src="assets/icons/glyph/flame.svg" alt="">';
  altar.appendChild(tSide);
  altar.appendChild(fire);
  altar.appendChild(dSide);
  box.appendChild(altar);

  if (lastSacrificeReveal && lastSacrificeReveal.recipe) {
    const rev = lastSacrificeReveal;
    const r = rev.recipe;
    const formula = r.inputs.map(i => `${ELEMENTS[i.id]?.name || i.id}${i.a > 1 ? '×' + i.a : ''}`).join(' + ') +
      ` → ${ELEMENTS[r.output]?.name || r.output}`;
    const revBox = document.createElement('div');
    revBox.className = 'sacrifice-reveal' + (rev.fresh ? ' fresh' : '');
    revBox.innerHTML = `<div class="rev-fire"><img src="assets/icons/glyph/flame.svg" alt=""></div><div class="rev-title">Жертва принята!</div><div class="rev-formula">${formula}</div>`;
    for (let i = 0; i < 14; i++) {
      const em = document.createElement('span');
      em.className = 'ember';
      em.style.left = (4 + Math.random() * 92) + '%';
      em.style.animationDelay = (Math.random() * 0.9).toFixed(2) + 's';
      em.style.animationDuration = (1.4 + Math.random() * 1.2).toFixed(2) + 's';
      const sz = 3 + Math.round(Math.random() * 3);
      em.style.width = sz + 'px';
      em.style.height = sz + 'px';
      revBox.appendChild(em);
    }
    box.appendChild(revBox);
    rev.fresh = false;
  }

  const targetRow = document.createElement('div');
  targetRow.className = 'sacrifice-row';
  const targetLabel = document.createElement('label');
  targetLabel.textContent = 'Цель:';
  const targetSelect = document.createElement('select');
  targetSelect.id = 'sacrifice-target';
  targets.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
  targets.forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    const p = getRecipeProgressForOutput(id);
    opt.textContent = `${ELEMENTS[id].name} (${p.revealed}/${p.total} рецептов)`;
    targetSelect.appendChild(opt);
  });
  // Переход из инфо-панели: подставляем нужный элемент целью ритуала
  if (grimoirePresetTarget && targets.includes(grimoirePresetTarget)) {
    targetSelect.value = grimoirePresetTarget;
  }
  grimoirePresetTarget = null;
  targetRow.appendChild(targetLabel);
  targetRow.appendChild(targetSelect);
  box.appendChild(targetRow);

  const donorRow = document.createElement('div');
  donorRow.className = 'sacrifice-row';
  const donorLabel = document.createElement('label');
  donorLabel.textContent = 'Жертва:';
  const donorSelect = document.createElement('select');
  donorSelect.id = 'sacrifice-donor';
  donorRow.appendChild(donorLabel);
  donorRow.appendChild(donorSelect);
  box.appendChild(donorRow);

  const costNote = document.createElement('div');
  costNote.className = 'sacrifice-cost';
  costNote.textContent = 'Стоимость рецепта: —';
  box.appendChild(costNote);

  const deductNote = document.createElement('div');
  deductNote.className = 'sacrifice-cost';
  deductNote.textContent = 'Спишется: —';
  box.appendChild(deductNote);

  const btn = document.createElement('button');
  btn.className = 'sacrifice-btn';
  btn.innerHTML = '<img class="sec-ico" src="assets/icons/glyph/flame.svg" alt="">Пожертвовать и узнать';
  btn.addEventListener('click', () => {
    const target = targetSelect.value;
    const donor = donorSelect.value;
    if (!target || !donor) return;
    const required = getRequiredAmount(sacrificeRolledRecipe, donor);
    if (required > (state.inventory[donor] || 0)) return;
    performSacrifice(target, donor, required);
  });
  box.appendChild(btn);

  const note = document.createElement('div');
  note.className = 'sacrifice-hint';
  note.textContent = 'Каждая жертва раскрывает один случайный рецепт — приносите жертвы повторно, чтобы раскрыть остальные. Рецепт появится в Книге рецептов, но засчитается только после реального крафта.';
  box.appendChild(note);

  const updateAltar = () => {
    const tId = targetSelect.value, dId = donorSelect.value;
    const tEl = tId ? ELEMENTS[tId] : null, dEl = dId ? ELEMENTS[dId] : null;
    const p = tId ? getRecipeProgressForOutput(tId) : null;
    const pct = p && p.total > 0 ? Math.round((p.revealed / p.total) * 100) : 0;
    tSide.innerHTML = tEl
      ? `<div class="s-icon">${buildIconSVG(tId, 28)}</div><div class="s-name">${tEl.name}</div><div class="s-sub">раскрыто ${p.revealed}/${p.total}</div><div class="sacrifice-progress"><i style="width:${pct}%"></i></div>`
      : `<div class="s-icon">?</div>`;
    const dQty = dId ? (state.inventory[dId] || 0) : 0;
    dSide.innerHTML = dEl
      ? `<div class="s-icon">${buildIconSVG(dId, 28)}</div><div class="s-name">${dEl.name}</div><div class="s-sub">в наличии ×${dQty}</div>`
      : `<div class="s-icon">?</div>`;
  };

  const updateDeductNote = () => {
    const donorId = donorSelect.value;
    const donor = donorId ? ELEMENTS[donorId] : null;
    if (!donor || !sacrificeRolledRecipe) {
      deductNote.textContent = 'Спишется: —';
      deductNote.classList.remove('bad');
      btn.disabled = true;
      updateAltar();
      return;
    }
    const required = getRequiredAmount(sacrificeRolledRecipe, donorId);
    const qty = state.inventory[donorId] || 0;
    const bad = required > qty;
    deductNote.innerHTML = bad
      ? `<img class="sec-ico" src="assets/icons/glyph/flame.svg" alt="">Спишется: ${required} × ${donor.name} — не хватает (есть ${qty})`
      : `<img class="sec-ico" src="assets/icons/glyph/flame.svg" alt="">Спишется: ${required} × ${donor.name}`;
    deductNote.classList.toggle('bad', bad);
    btn.disabled = bad || !targetSelect.value || !donorId;
    btn.innerHTML = bad
      ? 'Не хватает жертвы'
      : '<img class="sec-ico" src="assets/icons/glyph/flame.svg" alt="">Пожертвовать и узнать';
    updateAltar();
  };
  donorSelect.addEventListener('change', updateDeductNote);

  const rollRecipe = () => {
    sacrificeRolledRecipe = targetSelect.value ? pickSacrificeRecipe(targetSelect.value) : null;
    const cost = buildSacrificeDonors(donorSelect, sacrificeRolledRecipe);
    costNote.innerHTML = `<img class="sec-ico" src="assets/icons/glyph/sparkles.svg" alt="">Стоимость рецепта: ${cost > 0 ? cost + ' очков силы' : '—'}`;
    updateDeductNote();
  };
  targetSelect.addEventListener('change', rollRecipe);
  rollRecipe();

  content.appendChild(box);
}

function performSacrifice(targetId, donorId, amount) {
  const donor = ELEMENTS[donorId];
  if (!donor) return;
  if (!donor.starter && !donor.infinite) {
    const qty = state.inventory[donorId] || 0;
    if (qty < amount) return;
    state.inventory[donorId] = qty - amount;
  }
  const revealed = revealRecipe(sacrificeRolledRecipe);
  const target = ELEMENTS[targetId];
  if (revealed) {
    const p = getRecipeProgressForOutput(targetId);
    log(`🔥 Жертва принесена: раскрыт ${p.revealed} из ${p.total} рецептов «${target?.name || targetId}»`, 'info');
    lastSacrificeReveal = { recipe: sacrificeRolledRecipe, targetId, fresh: true };
    playDiscover();
  }
  updateUI();
  renderNotebook();
}

// ─── Achievements ───
export function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (state.achievements.has(a.id)) return;
    if (a.check(state)) {
      state.achievements.add(a.id);
      log(`🏆 Достижение: ${a.name}`, 'discovery');
      showAchievementToast(a);
      playAchievement();
    }
  });
}

function showAchievementToast(a) {
  const toast = document.getElementById('ach-toast');
  toast.querySelector('.ach-toast-title').innerHTML = `<img class="toast-ico" src="${achKitIcon(a)}" alt="">${achText(a)}`;
  toast.querySelector('.ach-toast-desc').textContent = a.desc;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function achEmoji(a) {
  const m = /^(\p{Extended_Pictographic}\uFE0F?|\p{Emoji_Presentation}|\S)/u.exec(a.name.trim());
  return m ? m[1] : '🏆';
}

function achText(a) {
  return a.name.replace(/^\S+\s+/, '');
}

// Иконки достижений по маппингу кита (assets/icons/ach/*.svg)
const ACH_ICONS = {
  '✨': 'sparkles', '🔍': 'magnify', '🧭': 'compass', '📚': 'books', '👑': 'crown',
  '📜': 'scroll', '📖': 'openbook', '📕': 'book-red', '🏛': 'temple', '💥': 'burst',
  '☄': 'comet', '🔥': 'flame', '🔄': 'cycle', '🐉': 'dragon', '🏭': 'factory',
  '🧪': 'flask-green', '⚗': 'alembic', '💑': 'rings', '🏺': 'amphora', '🌀': 'vortex',
  '⚖': 'scales', '🧬': 'dna', '🧙': 'wizard', '🍯': 'honey', '🐋': 'whale',
  '🕳': 'blackhole', '⚔': 'swords', '⏳': 'hourglass', '🦠': 'germ', '🌌': 'galaxy',
  '🌍': 'globe', '⚙': 'gear', '👤': 'person', '🌲': 'fir', '👻': 'ghost',
  '⚡': 'bolt', '🌪': 'tornado', '💤': 'zzz', '✋': 'hand', '🕊': 'dove',
  '🗿': 'moai', '⬜': 'cube', '🌟': 'star-great', '♾': 'infinity', '⚫': 'void-orb',
  '🥀': 'rose', '💀': 'skull', '🕰': 'clock',
};
function achKitIcon(a) {
  const key = Object.keys(ACH_ICONS).find(k => a.name.startsWith(k));
  return `assets/icons/ach/${key ? ACH_ICONS[key] : 'sparkles'}.svg`;
}

function getAchProgress(a) {
  const s = state;
  const num = (cur, max) => ({ cur: Math.min(cur, max), max });
  switch (a.id) {
    case 'firstMix': return num(s.stats.mixCount, 1);
    case 'discover10': return num(s.discovered.size, 10);
    case 'discover25': return num(s.discovered.size, 25);
    case 'discover40': return num(s.discovered.size, 40);
    case 'discoverAll': return num(s.discovered.size, ELEMENT_IDS.length);
    case 'recipes10': return num(s.foundRecipes.size, 10);
    case 'recipes25': return num(s.foundRecipes.size, 25);
    case 'recipes50': return num(s.foundRecipes.size, 50);
    case 'recipesAll': return num(s.foundRecipes.size, RECIPES.length);
    case 'firstBoom': return num(s.stats.explosionCount, 1);
    case 'boom10': return num(s.stats.explosionCount, 10);
    case 'fromAshes': return num(s.stats.discoveryFromExplosion, 1);
    case 'massProd': return num(s.stats.totalCreated, 500);
    case 'allVariants': return num(VARIANTS.filter(v => s.discovered.has(v)).length, VARIANTS.length);
    default: {
      // Общий случай: вытаскиваем все has('id') из check и считаем долю
      try {
        const ids = [...new Set([...a.check.toString().matchAll(/has\('([^']+)'\)/g)].map(m => m[1]))];
        if (ids.length > 0) return num(ids.filter(id => s.discovered.has(id)).length, ids.length);
      } catch {}
      return null;
    }
  }
}

function renderAchievements() {
  const list = document.getElementById('achievement-list');
  list.innerHTML = '';
  const total = ACHIEVEMENTS.length;
  const got = state.achievements.size;
  const head = document.createElement('div');
  head.className = 'ach-summary';
  const pct = total ? Math.round((got / total) * 100) : 0;
  head.innerHTML = `<div class="ach-summary-top"><span>Открыто <b>${got}/${total}</b></span><span>${pct}%</span></div><div class="ach-summary-bar"><i style="width:${pct}%"></i></div>`;
  list.appendChild(head);
  ACHIEVEMENTS.forEach(a => {
    const unlocked = state.achievements.has(a.id);
    const p = !unlocked ? getAchProgress(a) : null;
    const item = document.createElement('div');
    item.className = 'ach-item ' + (unlocked ? 'unlocked' : 'locked') + (p && p.max > 1 && p.cur >= p.max - 1 && p.cur < p.max ? ' near' : '');
    const icon = `<img class="ach-kit-ico${unlocked ? '' : ' locked-ico'}" src="${achKitIcon(a)}" alt="">`;
    const bar = (!unlocked && p && p.max > 1)
      ? `<div class="ach-bar"><i style="width:${Math.round((p.cur / p.max) * 100)}%"></i></div><div class="ach-prog">${p.cur}/${p.max}</div>`
      : ((!unlocked && p && p.max === 1) ? '' : '');
    item.innerHTML = `<div class="ach-icon">${icon}</div><div class="ach-info"><div class="ach-name">${achText(a)}</div><div class="ach-desc">${unlocked ? a.desc : (p && p.max > 1 ? `${a.desc} · ${p.cur}/${p.max}` : '???')}</div>${(!unlocked && p && p.max > 1) ? `<div class="ach-bar"><i style="width:${Math.round((p.cur / p.max) * 100)}%"></i></div><div class="ach-prog">${p.cur}/${p.max}</div>` : ''}</div><div class="ach-check"><img src="assets/icons/glyph/${unlocked ? 'check' : 'lock'}.svg" alt=""></div>`;
    item.title = unlocked ? a.desc : (p ? `${a.desc} — ${p.cur}/${p.max}` : '???');
    list.appendChild(item);
  });
}

export function openAchievements() {
  renderAchievements();
  openModalAnimated(document.getElementById('achievement-modal'));
}

export function closeAchievements(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('achievement-modal');
}

// ─── Recipe Tree ───
const TREE_MAX_ITEMS = 10;

function bringModalToFront(modal) {
  // Дерево всегда выше roadmap (фикс «модалка под модалкой»)
  const base = modal.id === 'tree-modal' ? 1200 : modal.id === 'roadmap-modal' ? 1050 : modal.id === 'welcome-modal' ? 1300 : 1000;
  modal.style.zIndex = String(base);
  modal.classList.remove('modal-closing');
  const t = modal._closeTimer;
  if (t) { clearTimeout(t); modal._closeTimer = null; }
}

const MODAL_CLOSE_MS = 160;

export function openModalAnimated(modal) {
  bringModalToFront(modal);
  modal.style.display = '';
  // Перезапуск open-анимации при быстром переоткрытии
  const box = modal.querySelector('.modal-box');
  if (box) {
    box.style.animation = 'none';
    // eslint-disable-next-line no-unused-expressions
    box.offsetHeight;
    box.style.animation = '';
  }
}

export function closeModalAnimated(idOrEl) {
  const modal = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!modal || modal.style.display === 'none' || modal.classList.contains('modal-closing')) return;
  modal.classList.add('modal-closing');
  modal._closeTimer = setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('modal-closing');
    modal._closeTimer = null;
  }, MODAL_CLOSE_MS);
}

export function openTree(id) {
  const modal = document.getElementById('tree-modal');
  const content = document.getElementById('tree-content');
  content.innerHTML = '';
  const el = ELEMENTS[id];
  if (!el) return;
  const header = modal.querySelector('.modal-header span');
  header.innerHTML = `<img class="mhead-ico" src="assets/icons/glyph/map.svg" alt="">Древо: ${el.name}`;
  renderTreeNode(id, 0, new Set([id]), content, true);
  openModalAnimated(modal);
  content.parentElement.scrollTop = 0;
}

export function closeTree(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('tree-modal');
}

function treeCycleBadge(name) {
  const d = document.createElement('div');
  d.className = 'tree-leaf tree-cycle';
  d.textContent = `${name} · уже выше`;
  d.title = 'Уже показано выше, чтобы не зацикливать древо';
  return d;
}

function treeFormulaRow(r) {
  const div = document.createElement('div');
  div.className = 'tree-formula';
  const formula = r.inputs.map(i => `${ELEMENTS[i.id]?.name || i.id}${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
  div.textContent = formula + ` → ${ELEMENTS[r.output]?.name || r.output}`;
  div.title = formula + ` → ${ELEMENTS[r.output]?.name || r.output}`;
  return div;
}

function renderTreeNode(id, depth, visited, container, isRoot = false) {
  if (depth > 2) {
    const div = document.createElement('div');
    div.className = 'tree-more';
    div.textContent = '··· глубже — откройте карточку элемента';
    container.appendChild(div);
    return;
  }
  const el = ELEMENTS[id];
  if (!el) return;
  const knownKeys = new Set(notebook.knownRecipes);
  const isKnownRecipe = (r) => state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r));
  const node = document.createElement('div');
  node.className = 'tree-node';
  const content = document.createElement('div');
  content.className = 'tree-node-content' + (isRoot ? ' tree-root' : '');
  content.innerHTML = `${kitGlyph(id, 18) || buildIconSVG(id, 18)}<span style="color:#fff">${el.name}</span>`;
  content.title = isRoot ? el.name : `Открыть древо: ${el.name}`;
  if (!isRoot) content.addEventListener('click', () => openTree(id));
  node.appendChild(content);
  container.appendChild(node);

  const children = document.createElement('div');
  children.className = 'tree-children';

  if (!el.starter) {
    const producing = RECIPES.filter(r => r.output === id && isKnownRecipe(r)).slice(0, TREE_MAX_ITEMS);
    const producingAll = RECIPES.filter(r => r.output === id && isKnownRecipe(r)).length;
    if (producing.length > 0) {
      const title = document.createElement('div');
      title.className = 'tree-section-title';
      title.textContent = '🧪 Получается из:';
      children.appendChild(title);
      producing.forEach(r => {
        children.appendChild(treeFormulaRow(r));
        r.inputs.forEach(inp => {
          if (visited.has(inp.id)) {
            children.appendChild(treeCycleBadge(ELEMENTS[inp.id]?.name || inp.id));
          } else {
            const nextVisited = new Set(visited);
            nextVisited.add(inp.id);
            renderTreeNode(inp.id, depth + 1, nextVisited, children);
          }
        });
      });
      if (producingAll > producing.length) {
        const more = document.createElement('div');
        more.className = 'tree-more';
        more.textContent = `+ ещё ${producingAll - producing.length} рецептов`;
        children.appendChild(more);
      }
    }
  }

  const usedInAll = RECIPES.filter(r => r.inputs.some(i => i.id === id) && isKnownRecipe(r));
  const usedIn = usedInAll.slice(0, TREE_MAX_ITEMS);
  if (usedIn.length > 0) {
    const title = document.createElement('div');
    title.className = 'tree-section-title';
    title.textContent = '🔗 Создаёт:';
    children.appendChild(title);
    usedIn.forEach(r => {
      children.appendChild(treeFormulaRow(r));
      if (visited.has(r.output)) {
        children.appendChild(treeCycleBadge(ELEMENTS[r.output]?.name || r.output));
      } else {
        const nextVisited = new Set(visited);
        nextVisited.add(r.output);
        renderTreeNode(r.output, depth + 1, nextVisited, children);
      }
    });
    if (usedInAll.length > usedIn.length) {
      const more = document.createElement('div');
      more.className = 'tree-more';
      more.textContent = `+ ещё ${usedInAll.length - usedIn.length} рецептов`;
      children.appendChild(more);
    }
  }

  if (children.children.length > 0) container.appendChild(children);
}

// ─── Statistics ───
function formatTime(msOrStart) {
  // Новый режим: msOrStart — это уже миллисекунды наигранного времени.
  // Старый режим (timestamp старта) поддерживаем для совместимости, но режем офлайн-накрутку.
  let playMs;
  if (typeof msOrStart === 'number' && msOrStart > 100000000000) {
    // Похоже на timestamp → считаем как раньше, но кап 24ч, чтобы не было «1532ч»
    playMs = Math.min(Date.now() - msOrStart, 24 * 3600 * 1000);
  } else {
    playMs = msOrStart || 0;
  }
  if (!playMs || playMs < 60000) return playMs > 0 ? 'меньше минуты' : '—';
  const totalMin = Math.floor(playMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 100) return `${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function renderStats() {
  const s = state.stats;
  const mostCreated = Object.entries(s.elementCreatedCount).sort((a, b) => b[1] - a[1]);
  const top = mostCreated.length > 0 && mostCreated[0][1] > 0 ? `${ELEMENTS[mostCreated[0][0]]?.name || mostCreated[0][0]} (${mostCreated[0][1]})` : '—';
  document.getElementById('stats-time').textContent = formatTime(getPlayMs());
  document.getElementById('stats-discovered').textContent = `${state.discovered.size} / ${ELEMENT_IDS.length}`;
  document.getElementById('stats-recipes').textContent = `${state.foundRecipes.size} / ${RECIPES.length}`;
  document.getElementById('stats-mixes').textContent = s.mixCount;
  document.getElementById('stats-explosions').textContent = s.explosionCount;
  document.getElementById('stats-from-ashes').textContent = s.discoveryFromExplosion;
  document.getElementById('stats-created').textContent = s.totalCreated;
  document.getElementById('stats-achievements').textContent = `${state.achievements.size} / ${ACHIEVEMENTS.length}`;
  const topEl = document.getElementById('stats-top-element');
  const topId = mostCreated.length > 0 && mostCreated[0][1] > 0 ? mostCreated[0][0] : null;
  topEl.innerHTML = topId ? `${buildIconSVG(topId, 20)}<span>${top}</span>` : top;
  const setBar = (id, cur, max) => {
    const b = document.getElementById(id);
    if (b) b.style.width = (max ? Math.min(100, Math.round((cur / max) * 100)) : 0) + '%';
  };
  setBar('bar-discovered', state.discovered.size, ELEMENT_IDS.length);
  setBar('bar-recipes', state.foundRecipes.size, RECIPES.length);
  setBar('bar-achievements', state.achievements.size, ACHIEVEMENTS.length);
  const sess = document.getElementById('stats-session');
  if (sess) {
    const sessMs = s.sessionStart ? Math.max(0, Date.now() - s.sessionStart) : 0;
    sess.textContent = sessMs >= 60000 ? `сессия ${formatTime(sessMs)}` : '';
  }
}

export function openStats() {
  renderStats();
  openModalAnimated(document.getElementById('stats-modal'));
}

export function closeStats(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('stats-modal');
}

// ─── Craft Roadmap ───
function createRoadmapCard(id) {
  const el = ELEMENTS[id];
  if (!el) return null;
  const discovered = state.discovered.has(id);
  const cat = ELEMENT_CATS[id];
  const catColor = CATEGORIES[cat]?.color || '#888';
  const recipesFor = RECIPES.filter(r => r.output === id && state.foundRecipes.has(recipeKey(r)));
  const parents = recipesFor.length > 0 ? recipesFor[0].inputs.map(i => i.id) : [];

  const card = document.createElement('div');
  card.className = 'roadmap-card' + (discovered ? '' : ' roadmap-undiscovered');

  if (discovered) {
    card.style.borderColor = catColor;
    const parentNames = parents.map(pid => ELEMENTS[pid]?.name || pid).join(' + ');
    card.title = parentNames ? `${el.name} ← ${parentNames}` : el.name;
    card.innerHTML = `${KIT_MEDAL[id] ? `<img class="roadmap-medal" src="assets/icons/${KIT_MEDAL[id]}" alt="${el.name}">` : buildIconSVG(id, 22)}<span class="roadmap-name" title="${el.name}">${el.name}</span>`;
    if (parents.length > 0) {
      const parentDots = document.createElement('div');
      parentDots.className = 'roadmap-parents';
      parentDots.title = `Из: ${parentNames}`;
      parents.forEach(pid => {
        const pel = ELEMENTS[pid];
        if (!pel) return;
        const dot = document.createElement('span');
        dot.className = 'roadmap-parent-dot';
        dot.style.background = pel.color;
        dot.title = pel.name;
        parentDots.appendChild(dot);
      });
      card.appendChild(parentDots);
    }
    card.addEventListener('click', () => openTree(id));
  } else {
    card.title = 'Не открыт — смешивайте элементы, чтобы открыть';
    card.innerHTML = `<div class="roadmap-unknown">?</div><span class="roadmap-name">???</span>`;
  }

  return card;
}

function renderCraftRoadmap() {
  const content = document.getElementById('roadmap-content');
  content.innerHTML = '';
  const showAll = document.getElementById('roadmap-spoiler').checked;

  for (let d = 0; d <= MAX_DEPTH; d++) {
    const ids = DEPTH_GROUPS[d];
    if (!ids || ids.length === 0) continue;

    const toShow = showAll ? ids : ids.filter(id => state.discovered.has(id));
    if (toShow.length === 0) continue;

    const row = document.createElement('div');
    row.className = 'roadmap-row';

    const label = document.createElement('div');
    label.className = 'roadmap-depth-label';
    label.innerHTML = `Ур.${d}`;
    label.title = d === 0 ? 'Базовые стихии' : `Глубина крафта ${d}`;
    const labelHint = document.createElement('div');
    labelHint.className = 'roadmap-depth-hint';
    labelHint.textContent = showAll ? `${ids.length} эл.` : `${toShow.length}/${ids.length}`;
    label.appendChild(labelHint);
    row.appendChild(label);

    const cards = document.createElement('div');
    cards.className = 'roadmap-cards';
    toShow.forEach(id => {
      const card = createRoadmapCard(id);
      if (card) cards.appendChild(card);
    });

    if (cards.children.length > 0) {
      row.appendChild(cards);
      content.appendChild(row);
    }
  }

  if (content.children.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'nb-empty';
    empty.textContent = 'Пока ничего не открыто на этой глубине. Включите «Показать всё», чтобы увидеть спойлеры.';
    content.appendChild(empty);
  } else {
    const legend = document.createElement('div');
    legend.className = 'roadmap-legend';
    legend.innerHTML = '● — цвет точки = родительский элемент (наведите, чтобы увидеть имя). Клик по карточке — древо рецепта.';
    content.appendChild(legend);
  }

}

export function openCraftRoadmap() {
  const modal = document.getElementById('roadmap-modal');
  const content = document.getElementById('roadmap-content');
  content.innerHTML = '';
  const checkbox = document.getElementById('roadmap-spoiler');
  checkbox.onchange = renderCraftRoadmap;
  renderCraftRoadmap();
  openModalAnimated(modal);
  content.scrollTop = 0;
}

export function closeCraftRoadmap(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('roadmap-modal');
}

// ─── Mobile tab switching ───
export function switchTab(tab) {
  document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('#inventory-panel, #recipes-panel, #log-panel').forEach(p => {
    p.classList.remove('mobile-visible');
  });
  if (tab === 'cauldron') return;
  const map = { inventory: 'inventory-panel', recipes: 'recipes-panel', log: 'log-panel' };
  const panel = document.getElementById(map[tab]);
  if (panel) panel.classList.add('mobile-visible');
}

// Close mobile panel on backdrop click
document.addEventListener('click', (e) => {
  const open = document.querySelector('.mobile-visible');
  if (!open) return;
  if (!open.contains(e.target) && !e.target.closest('#tab-bar')) {
    open.classList.remove('mobile-visible');
    document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === 'cauldron');
    });
  }
});
