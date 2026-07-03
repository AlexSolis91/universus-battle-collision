// ============================================================
//  UNIVERSUS: Battle Collision
//  characters-v2.js — 10 personajes de prueba
//  Cada personaje tiene 16 movimientos + 4 pasivas
//  Sistema de pool: 4 slots activos + 3 slots de pasiva
// ============================================================

// ── ESTRUCTURA DE UN MOVIMIENTO ────────────────────────────
// {
//   id: string único,
//   name: string,
//   learnLevel: number,
//   type: 'basic' | 'special' | 'over',
//   target: 'single' | 'aoe' | 'self' | 'ally_single' | 'ally_aoe' | 'random_enemy',
//   cost: number (cargas),
//   chargeGain: number,
//   damage: number,
//   description: string,
//   effects: [ { type, value, duration?, condition? } ]
// }
//
// ── ESTRUCTURA DE UNA PASIVA ────────────────────────────────
// {
//   id: string único,
//   name: string,
//   learnLevel: number,
//   description: string,
//   trigger: 'permanent' | 'on_turn_start' | 'on_hit_received' | 'on_kill' | 'on_ally_death',
//   effects: [ { type, value, duration?, condition? } ]
// }

const CHARACTERS_V2 = {

  // ════════════════════════════════════════════════════════
  //  1. GOKU
  //  Especialidades: A) Saiyajin Puro (daño/transformaciones)
  //                  B) Guardián (soporte/regeneración)
  //                  C) Ultra Instinto (esquiva/contraataque)
  // ════════════════════════════════════════════════════════
  'Goku': {
    portrait: '',           // ← URL de imagen aquí
    transformPortrait: '',  // ← URL imagen transformado
    hp: 22,
    maxHp: 22,
    speed: 95,
    level: 1,
    xp: 0,
    movePool: ['goku_m1', 'goku_m2', 'goku_m3', 'goku_m4'], // 4 slots activos
    passiveSlots: ['goku_p1'],                                  // hasta 3 pasivas equipadas

    moves: [
      // ── MOVIMIENTOS ───────────────────────────────────────
      { id:'goku_m1', name:'Kamehameha', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Dispara una ola de energía. 30% de probabilidad de crítico (daño x2).',
        effects:[ {type:'damage', value:3}, {type:'crit', value:0.3} ] },

      { id:'goku_m2', name:'Golpe Kaioken', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:4,
        description:'Ataque veloz potenciado. Genera 1 carga adicional si el objetivo tiene un debuff.',
        effects:[ {type:'damage', value:4}, {type:'bonus_charge_if_debuff', value:1} ] },

      { id:'goku_m3', name:'Kaioken x3', learnLevel:8,
        type:'special', target:'self', cost:3, chargeGain:0, damage:0,
        description:'Multiplica el poder de Goku. Gana Furia 2 turnos y Regeneración 10% 2T.',
        effects:[ {type:'buff', value:'Furia', duration:2}, {type:'regen', value:10, duration:2} ] },

      { id:'goku_m4', name:'Kamehameha x10', learnLevel:12,
        type:'special', target:'single', cost:5, chargeGain:0, damage:7,
        description:'Versión masiva del Kamehameha. Causa 7 de daño. Aplica Quemadura 5% 2T.',
        effects:[ {type:'damage', value:7}, {type:'burn_pct', value:5, duration:2} ] },

      { id:'goku_m5', name:'Teletransportación', learnLevel:16,
        type:'special', target:'self', cost:4, chargeGain:1, damage:0,
        description:'Desaparece del campo. Obtiene Sigilo 1T y Esquiva Área 1T.',
        effects:[ {type:'buff', value:'Sigilo', duration:1}, {type:'buff', value:'Esquiva Area', duration:1} ] },

      { id:'goku_m6', name:'Ráfaga de Cargas', learnLevel:20,
        type:'special', target:'self', cost:0, chargeGain:5, damage:0,
        description:'Concentra energía. Genera 5 cargas inmediatamente.',
        effects:[ {type:'generate_charges', value:5} ] },

      { id:'goku_m7', name:'Kaioken x20', learnLevel:25,
        type:'special', target:'self', cost:6, chargeGain:0, damage:0,
        description:'Transforma a Goku en SS. Sus ataques hacen +3 daño adicional por 3 turnos.',
        effects:[ {type:'buff', value:'Furia', duration:3}, {type:'damage_boost', value:3, duration:3} ] },

      { id:'goku_m8', name:'Genkidama', learnLevel:30,
        type:'over', target:'aoe', cost:10, chargeGain:0, damage:6,
        description:'Energía del universo. 6 de daño AOE. Roba 2 cargas a cada enemigo golpeado.',
        effects:[ {type:'damage_aoe', value:6}, {type:'steal_charges_aoe', value:2} ] },

      { id:'goku_m9', name:'Puño del Dragón', learnLevel:35,
        type:'special', target:'single', cost:7, chargeGain:0, damage:9,
        description:'9 de daño. Si el objetivo tiene más de 10 cargas, daño doble.',
        effects:[ {type:'damage', value:9}, {type:'double_if_charges_above', value:10} ] },

      { id:'goku_m10', name:'Ultra Instinto', learnLevel:45,
        type:'over', target:'self', cost:12, chargeGain:0, damage:0,
        description:'Transforma a Goku. Obtiene Esquiva Área, Contraataque y Furia por 3 turnos.',
        effects:[ {type:'buff', value:'Esquiva Area', duration:3}, {type:'buff', value:'Contraataque', duration:3}, {type:'buff', value:'Furia', duration:3}, {type:'transform', value:'ultraInstinto'} ] },

      { id:'goku_m11', name:'Kamehameha Final', learnLevel:50,
        type:'over', target:'single', cost:11, chargeGain:0, damage:12,
        description:'12 de daño. 50% de crítico. Aplica Quemadura Solar 3T al objetivo.',
        effects:[ {type:'damage', value:12}, {type:'crit', value:0.5}, {type:'solar_burn', value:5, duration:3} ] },

      { id:'goku_m12', name:'Instinto Superior: Ataque', learnLevel:55,
        type:'special', target:'single', cost:8, chargeGain:0, damage:8,
        description:'8 de daño. Si Goku tiene Esquiva Área activa: aplica Aturdimiento 1T al objetivo.',
        effects:[ {type:'damage', value:8}, {type:'stun_if_self_aoe_immunity', duration:1} ] },

      { id:'goku_m13', name:'Espíritu Compartido', learnLevel:60,
        type:'special', target:'ally_aoe', cost:6, chargeGain:0, damage:0,
        description:'Otorga a todos los aliados Regeneración 10% por 2 turnos y 3 cargas.',
        effects:[ {type:'regen_team', value:10, duration:2}, {type:'generate_charges_team', value:3} ] },

      { id:'goku_m14', name:'Genkidama Universal', learnLevel:70,
        type:'over', target:'aoe', cost:14, chargeGain:0, damage:10,
        description:'10 de daño AOE. Elimina todos los buffs enemigos antes del daño.',
        effects:[ {type:'dispel_buffs_aoe'}, {type:'damage_aoe', value:10} ] },

      { id:'goku_m15', name:'Ultra Instinto Dominado', learnLevel:80,
        type:'over', target:'single', cost:15, chargeGain:0, damage:15,
        description:'El poder definitivo. 15 de daño. 70% de crítico. Aplica Quemadura Solar permanente.',
        effects:[ {type:'damage', value:15}, {type:'crit', value:0.7}, {type:'solar_burn', value:8, duration:999} ] },

      { id:'goku_m16', name:'Omega Kamehameha', learnLevel:99,
        type:'over', target:'aoe', cost:18, chargeGain:0, damage:14,
        description:'El ataque final de Goku. 14 de daño AOE. Causa Quemadura Solar 3T a todos los enemigos. No puede esquivarse.',
        effects:[ {type:'damage_aoe', value:14}, {type:'solar_burn_aoe', value:6, duration:3} ] },
    ],

    passives: [
      { id:'goku_p1', name:'Espíritu Saiyajin', learnLevel:1,
        description:'Al inicio de su turno, si Goku tiene menos del 30% de HP, genera 3 cargas adicionales.',
        trigger:'on_turn_start',
        effects:[ {type:'charges_if_hp_below', value:3, threshold:30} ] },

      { id:'goku_p2', name:'Cuerpo de Acero', learnLevel:20,
        description:'Goku recibe -1 de daño de todos los ataques (mínimo 1).',
        trigger:'permanent',
        effects:[ {type:'damage_reduction_flat', value:1} ] },

      { id:'goku_p3', name:'Instinto Salvaje', learnLevel:40,
        description:'Cuando Goku recibe un golpe crítico, contraataca automáticamente con 3 de daño.',
        trigger:'on_hit_received',
        effects:[ {type:'counterattack_on_crit', value:3} ] },

      { id:'goku_p4', name:'Última Reserva', learnLevel:60,
        description:'La primera vez que Goku llega a 0 HP en una batalla, sobrevive con 1 HP y regenera 5 cargas.',
        trigger:'permanent',
        effects:[ {type:'survive_once', value:1}, {type:'charges_on_survive', value:5} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  2. LICH KING (Arthas)
  //  Especialidades: A) Destructor de Almas (daño/ejecuciones)
  //                  B) Rey de la Muerte (invocación/revivir)
  //                  C) Señor del Invierno (congelación/CC)
  // ════════════════════════════════════════════════════════
  'Lich King': {
    portrait: '',
    transformPortrait: '',
    hp: 26,
    maxHp: 26,
    speed: 78,
    level: 1,
    xp: 0,
    movePool: ['lk_m1', 'lk_m2', 'lk_m3', 'lk_m4'],
    passiveSlots: ['lk_p1'],

    moves: [
      { id:'lk_m1', name:'Golpe de Frostmourne', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Ataque con la espada maldita. 3 de daño. Aplica Sangrado 1HP 2T.',
        effects:[ {type:'damage', value:3}, {type:'bleed', value:1, duration:2} ] },

      { id:'lk_m2', name:'Lanza de Hielo', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:4,
        description:'Proyectil de escarcha. 4 de daño. 40% de probabilidad de Congelación 1T.',
        effects:[ {type:'damage', value:4}, {type:'freeze_chance', value:0.4, duration:1} ] },

      { id:'lk_m3', name:'Nova de Escarcha', learnLevel:8,
        type:'special', target:'aoe', cost:4, chargeGain:0, damage:3,
        description:'Ola de frío. 3 de daño AOE. Aplica Ralentización (velocidad -20) 2T a todos.',
        effects:[ {type:'damage_aoe', value:3}, {type:'slow_aoe', value:20, duration:2} ] },

      { id:'lk_m4', name:'Invocación: No-Muerto', learnLevel:12,
        type:'special', target:'self', cost:5, chargeGain:0, damage:0,
        description:'Invoca un Ghoul aliado (HP:8, ataca 2 daño por turno al enemigo más débil).',
        effects:[ {type:'summon', value:'ghoul'} ] },

      { id:'lk_m5', name:'Tormenta de Sombras', learnLevel:16,
        type:'special', target:'aoe', cost:5, chargeGain:0, damage:4,
        description:'4 de daño AOE. Drena 2 cargas de cada enemigo.',
        effects:[ {type:'damage_aoe', value:4}, {type:'drain_charges_aoe', value:2} ] },

      { id:'lk_m6', name:'Abrazo de la Muerte', learnLevel:20,
        type:'special', target:'single', cost:6, chargeGain:0, damage:5,
        description:'5 de daño. Si el objetivo tiene Congelación, el daño es doble.',
        effects:[ {type:'damage', value:5}, {type:'double_if_frozen'} ] },

      { id:'lk_m7', name:'Fortaleza Helada', learnLevel:25,
        type:'special', target:'self', cost:4, chargeGain:0, damage:0,
        description:'Crea una barrera de hielo. Gana Escudo 6HP. Los atacantes reciben Congelación 1T.',
        effects:[ {type:'shield', value:6}, {type:'buff', value:'Aura Helada', duration:3} ] },

      { id:'lk_m8', name:'Decreto de la Muerte', learnLevel:30,
        type:'special', target:'single', cost:7, chargeGain:0, damage:6,
        description:'6 de daño. Si el objetivo tiene menos de 5 HP, lo elimina instantáneamente.',
        effects:[ {type:'damage', value:6}, {type:'execute_if_hp_below', value:5} ] },

      { id:'lk_m9', name:'Congelación Total', learnLevel:35,
        type:'over', target:'aoe', cost:9, chargeGain:0, damage:4,
        description:'4 de daño AOE. Aplica Mega Congelación (2T, irrompible) a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:4}, {type:'mega_freeze_aoe', duration:2} ] },

      { id:'lk_m10', name:'Cosecha de Almas', learnLevel:45,
        type:'over', target:'aoe', cost:11, chargeGain:0, damage:5,
        description:'5 de daño AOE. Robo de vida: Lich King recupera 1 HP por enemigo golpeado.',
        effects:[ {type:'damage_aoe', value:5}, {type:'lifesteal_aoe', value:1} ] },

      { id:'lk_m11', name:'Resurrección Maldita', learnLevel:50,
        type:'over', target:'ally_single', cost:12, chargeGain:0, damage:0,
        description:'Revive a un aliado caído con 8 HP, 5 cargas y debuff Cuerpo Sin Vida (no puede curar).',
        effects:[ {type:'revive', value:8}, {type:'generate_charges_target', value:5}, {type:'debuff', value:'Cuerpo Sin Vida', duration:999} ] },

      { id:'lk_m12', name:'Plaga de Sombras', learnLevel:55,
        type:'special', target:'single', cost:7, chargeGain:0, damage:0,
        description:'Aplica Veneno 3HP, Quemadura 2HP y Sangrado 2HP por 3 turnos al objetivo.',
        effects:[ {type:'poison', value:3, duration:3}, {type:'burn', value:2, duration:3}, {type:'bleed', value:2, duration:3} ] },

      { id:'lk_m13', name:'Reinado del Invierno', learnLevel:60,
        type:'over', target:'self', cost:10, chargeGain:0, damage:0,
        description:'Activa el aura definitiva: todos los enemigos reciben Congelación al atacar a Lich King por 4T.',
        effects:[ {type:'buff', value:'Aura Helada Suprema', duration:4} ] },

      { id:'lk_m14', name:'Ejército de los Muertos', learnLevel:70,
        type:'over', target:'self', cost:13, chargeGain:0, damage:0,
        description:'Invoca 3 No-Muertos simultáneamente (Ghoul HP:8, Espectro HP:6, Liche HP:10).',
        effects:[ {type:'summon', value:'ghoul'}, {type:'summon', value:'specter'}, {type:'summon', value:'lichling'} ] },

      { id:'lk_m15', name:'Toque de la Muerte', learnLevel:80,
        type:'over', target:'single', cost:14, chargeGain:0, damage:0,
        description:'Sin daño inicial. Aplica una maldición: en 2 turnos el objetivo muere si no tiene más de 8 HP.',
        effects:[ {type:'death_curse', value:8, duration:2} ] },

      { id:'lk_m16', name:'La Oscuridad Eterna', learnLevel:99,
        type:'over', target:'aoe', cost:18, chargeGain:0, damage:8,
        description:'El poder del Rey Exánime. 8 de daño AOE. Aplica Plaga (veneno 4HP+sangrado 2HP) 4T. Lich King resucita con 5 HP si muere este turno.',
        effects:[ {type:'damage_aoe', value:8}, {type:'plague_aoe', duration:4}, {type:'revive_self_this_turn', value:5} ] },
    ],

    passives: [
      { id:'lk_p1', name:'Armadura Helada', learnLevel:1,
        description:'Lich King es inmune a Congelación. Los ataques físicos que recibe reducen 1 de daño (mínimo 1).',
        trigger:'permanent',
        effects:[ {type:'immunity', value:'freeze'}, {type:'damage_reduction_flat', value:1} ] },

      { id:'lk_p2', name:'Aura Gélida', learnLevel:20,
        description:'Cuando un enemigo ataca a Lich King, recibe Congelación 1 turno.',
        trigger:'on_hit_received',
        effects:[ {type:'freeze_attacker', duration:1} ] },

      { id:'lk_p3', name:'Rey de la Muerte', learnLevel:40,
        description:'Cuando Lich King elimina a un enemigo, lo revive como aliado con 5 HP y 0 cargas por 2 rondas.',
        trigger:'on_kill',
        effects:[ {type:'raise_dead_on_kill', value:5, duration:2} ] },

      { id:'lk_p4', name:'Voluntad de Arthas', learnLevel:60,
        description:'Lich King nunca puede ser eliminado por un solo golpe que sea mayor o igual a su HP máximo. Sobrevive con 1 HP.',
        trigger:'permanent',
        effects:[ {type:'survive_one_shot'} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  3. SAITAMA
  //  Especialidades: A) Golpe Serio (one-hit kills / daño puro)
  //                  B) Entrenamiento (acumulación / cargas)
  //                  C) Héroe de Clase S (soporte / intimidación)
  // ════════════════════════════════════════════════════════
  'Saitama': {
    portrait: '',
    transformPortrait: '',
    hp: 20,
    maxHp: 20,
    speed: 88,
    level: 1,
    xp: 0,
    movePool: ['sai_m1', 'sai_m2', 'sai_m3', 'sai_m4'],
    passiveSlots: ['sai_p1'],

    moves: [
      { id:'sai_m1', name:'Puñetazo Normal', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:1, damage:2,
        description:'Un puñetazo sin esfuerzo. 2 de daño. 50% de probabilidad de crítico.',
        effects:[ {type:'damage', value:2}, {type:'crit', value:0.5} ] },

      { id:'sai_m2', name:'Golpe Normal', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:1, damage:3,
        description:'3 de daño. Golpea entre 1 y 3 enemigos aleatorios. Genera 1 carga por cada enemigo golpeado.',
        effects:[ {type:'damage_multi_random', value:3, min_targets:1, max_targets:3}, {type:'charge_per_target', value:1} ] },

      { id:'sai_m3', name:'Golpe Serio', learnLevel:8,
        type:'special', target:'aoe', cost:3, chargeGain:0, damage:3,
        description:'3 de daño AOE. Causa 3 de daño adicional por cada debuff activo en cada enemigo golpeado.',
        effects:[ {type:'damage_aoe', value:3}, {type:'bonus_per_debuff', value:3} ] },

      { id:'sai_m4', name:'Empuje del Aire', learnLevel:12,
        type:'special', target:'aoe', cost:4, chargeGain:0, damage:2,
        description:'Onda de choque. 2 de daño AOE. Empuja a todos los enemigos: pierden sus buffs activos.',
        effects:[ {type:'damage_aoe', value:2}, {type:'dispel_buffs_aoe'} ] },

      { id:'sai_m5', name:'Lluvia de Golpes', learnLevel:16,
        type:'special', target:'single', cost:5, chargeGain:0, damage:0,
        description:'Golpea 5 veces al mismo objetivo. Cada golpe causa 2 de daño. 100 golpes = instant kill (nunca sucede).',
        effects:[ {type:'damage_multi_target', value:2, hits:5} ] },

      { id:'sai_m6', name:'Intimidación de Héroe', learnLevel:20,
        type:'special', target:'aoe', cost:4, chargeGain:0, damage:0,
        description:'La presencia de Saitama aterra. Aplica Miedo 2T a todos los enemigos.',
        effects:[ {type:'fear_aoe', duration:2} ] },

      { id:'sai_m7', name:'Golpe Hacia Atrás', learnLevel:25,
        type:'special', target:'single', cost:5, chargeGain:0, damage:6,
        description:'6 de daño. Si el objetivo tiene Miedo activo, el daño se triplica.',
        effects:[ {type:'damage', value:6}, {type:'triple_if_feared'} ] },

      { id:'sai_m8', name:'Golpe Serio: Tabla', learnLevel:30,
        type:'over', target:'single', cost:8, chargeGain:0, damage:12,
        description:'12 de daño a un enemigo. Ignora escudo y armadura.',
        effects:[ {type:'damage_piercing', value:12} ] },

      { id:'sai_m9', name:'Acumulación Límite', learnLevel:35,
        type:'special', target:'self', cost:0, chargeGain:8, damage:0,
        description:'Acumula energía concentrada. Genera 8 cargas inmediatamente.',
        effects:[ {type:'generate_charges', value:8} ] },

      { id:'sai_m10', name:'Golpe Serio: Ráfaga', learnLevel:45,
        type:'over', target:'aoe', cost:11, chargeGain:0, damage:8,
        description:'8 de daño AOE. Ignora escudo. Causa Aturdimiento 1T a cada enemigo golpeado.',
        effects:[ {type:'damage_aoe_piercing', value:8}, {type:'stun_aoe', duration:1} ] },

      { id:'sai_m11', name:'El Puño del Universo', learnLevel:50,
        type:'over', target:'single', cost:13, chargeGain:0, damage:20,
        description:'El golpe definitivo de Saitama. 20 de daño. Si el objetivo sobrevive, recibe Quemadura Solar permanente.',
        effects:[ {type:'damage', value:20}, {type:'solar_burn_if_survives', value:8, duration:999} ] },

      { id:'sai_m12', name:'Golpe Consecutivo Normal', learnLevel:55,
        type:'special', target:'single', cost:6, chargeGain:0, damage:4,
        description:'4 de daño. Si el objetivo tiene más HP que Saitama, causa daño adicional igual a la diferencia de HP.',
        effects:[ {type:'damage', value:4}, {type:'bonus_equal_to_hp_diff'} ] },

      { id:'sai_m13', name:'Entrenamiento Secreto', learnLevel:60,
        type:'special', target:'self', cost:3, chargeGain:0, damage:0,
        description:'Saitama recuerda su entrenamiento. Gana Furia y Concentración por 2 turnos.',
        effects:[ {type:'buff', value:'Furia', duration:2}, {type:'buff', value:'Concentración', duration:2} ] },

      { id:'sai_m14', name:'Golpe Serio: Meteorito', learnLevel:70,
        type:'over', target:'aoe', cost:14, chargeGain:0, damage:10,
        description:'10 de daño AOE. Rompe todos los escudos. Los enemigos sin escudo reciben 5 daño adicional.',
        effects:[ {type:'damage_aoe_shield_break', value:10}, {type:'bonus_if_no_shield', value:5} ] },

      { id:'sai_m15', name:'El Golpe que lo Termina Todo', learnLevel:80,
        type:'over', target:'single', cost:16, chargeGain:0, damage:0,
        description:'Si el objetivo tiene 15 HP o menos: eliminación instantánea. Si tiene más: causa 15 de daño.',
        effects:[ {type:'execute_or_damage', threshold:15, fallback_damage:15} ] },

      { id:'sai_m16', name:'Golpe Serio: Tabla del Fin del Mundo', learnLevel:99,
        type:'over', target:'aoe', cost:20, chargeGain:0, damage:18,
        description:'El ataque más poderoso de Saitama. 18 de daño AOE. Ignora todo — escudos, armadura, esquiva. Saitama pierde todos sus buffs al usarlo.',
        effects:[ {type:'damage_aoe_true', value:18}, {type:'remove_self_buffs'} ] },
    ],

    passives: [
      { id:'sai_p1', name:'Cuerpo Supremo', learnLevel:1,
        description:'Saitama siempre hace mínimo 2 de daño. Sus ataques básicos ignoran escudo.',
        trigger:'permanent',
        effects:[ {type:'min_damage', value:2}, {type:'basic_pierces_shield'} ] },

      { id:'sai_p2', name:'Sin Emociones', learnLevel:20,
        description:'Saitama es inmune a Miedo, Confusión y Posesión.',
        trigger:'permanent',
        effects:[ {type:'immunity', value:'fear'}, {type:'immunity', value:'confusion'}, {type:'immunity', value:'possession'} ] },

      { id:'sai_p3', name:'Aburrimiento de Héroe', learnLevel:40,
        description:'Cuando Saitama usa un movimiento Básico, tiene 20% de probabilidad de usarlo una segunda vez gratis.',
        trigger:'on_basic_use',
        effects:[ {type:'double_basic_chance', value:0.20} ] },

      { id:'sai_p4', name:'El Más Fuerte', learnLevel:60,
        description:'Si Saitama tiene menos del 20% de HP, todos sus ataques hacen daño triple.',
        trigger:'permanent',
        effects:[ {type:'triple_damage_if_hp_below', threshold:20} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  4. RENGOKU (Kyojuro)
  //  Especialidades: A) Pilar de Fuego (daño/quemadura masiva)
  //                  B) Técnica Llama (velocidad/multi-hit)
  //                  C) Determinación (soporte/sacrificio)
  // ════════════════════════════════════════════════════════
  'Rengoku': {
    portrait: '',
    transformPortrait: '',
    hp: 21,
    maxHp: 21,
    speed: 92,
    level: 1,
    xp: 0,
    movePool: ['ren_m1', 'ren_m2', 'ren_m3', 'ren_m4'],
    passiveSlots: ['ren_p1'],

    moves: [
      { id:'ren_m1', name:'Corte de Llama', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Tajo ardiente. 3 de daño. Aplica Quemadura 5% 1T.',
        effects:[ {type:'damage', value:3}, {type:'burn_pct', value:5, duration:1} ] },

      { id:'ren_m2', name:'Ráfaga Ígnea', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:4,
        description:'4 de daño. Si el objetivo ya tiene Quemadura, el daño es +2.',
        effects:[ {type:'damage', value:4}, {type:'bonus_if_burned', value:2} ] },

      { id:'ren_m3', name:'Resplandor del Sol', learnLevel:8,
        type:'special', target:'self', cost:3, chargeGain:0, damage:0,
        description:'Envuelve a Rengoku en llamas. Gana Furia y Frenesí por 2 turnos.',
        effects:[ {type:'buff', value:'Furia', duration:2}, {type:'buff', value:'Frenesí', duration:2} ] },

      { id:'ren_m4', name:'Danza de la Llama: 2da Forma', learnLevel:12,
        type:'special', target:'single', cost:4, chargeGain:0, damage:5,
        description:'5 de daño. Aplica Quemadura 8% 2T. 30% de probabilidad de crítico.',
        effects:[ {type:'damage', value:5}, {type:'burn_pct', value:8, duration:2}, {type:'crit', value:0.3} ] },

      { id:'ren_m5', name:'Lluvia de Brasas', learnLevel:16,
        type:'special', target:'aoe', cost:5, chargeGain:0, damage:3,
        description:'3 de daño AOE. Aplica Quemadura 5% 2T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:3}, {type:'burn_pct_aoe', value:5, duration:2} ] },

      { id:'ren_m6', name:'Danza de la Llama: 5ta Forma', learnLevel:20,
        type:'special', target:'single', cost:6, chargeGain:0, damage:7,
        description:'Cinco tajos rápidos. 7 de daño total distribuido. Ignora esquiva.',
        effects:[ {type:'damage_multi_target', value:2, hits:4, ignore_dodge:true} ] },

      { id:'ren_m7', name:'Voluntad de Hierro', learnLevel:25,
        type:'special', target:'self', cost:4, chargeGain:0, damage:0,
        description:'Determinación absoluta. Gana Escudo 5HP e inmunidad a Quemadura 3T.',
        effects:[ {type:'shield', value:5}, {type:'immunity_temp', value:'burn', duration:3} ] },

      { id:'ren_m8', name:'Danza de la Llama: 8va Forma', learnLevel:30,
        type:'over', target:'single', cost:9, chargeGain:0, damage:10,
        description:'El tajo definitivo. 10 de daño. Aplica Quemadura Solar 3T.',
        effects:[ {type:'damage', value:10}, {type:'solar_burn', value:6, duration:3} ] },

      { id:'ren_m9', name:'Torbellino de Fuego', learnLevel:35,
        type:'over', target:'aoe', cost:10, chargeGain:0, damage:5,
        description:'5 de daño AOE. Genera 3 cargas por cada enemigo con Quemadura que golpea.',
        effects:[ {type:'damage_aoe', value:5}, {type:'charges_per_burned_enemy', value:3} ] },

      { id:'ren_m10', name:'Protección del Pilar', learnLevel:45,
        type:'special', target:'ally_aoe', cost:6, chargeGain:0, damage:0,
        description:'Escuda a todos los aliados (Escudo 4HP) y les otorga Regeneración 10% 2T.',
        effects:[ {type:'shield_team', value:4}, {type:'regen_team', value:10, duration:2} ] },

      { id:'ren_m11', name:'Incineración Total', learnLevel:50,
        type:'over', target:'aoe', cost:12, chargeGain:0, damage:7,
        description:'7 de daño AOE. Aplica Quemadura Solar 2T a todos. El daño de Quemadura de este turno se aplica inmediatamente.',
        effects:[ {type:'damage_aoe', value:7}, {type:'solar_burn_aoe', value:5, duration:2}, {type:'burn_tick_now'} ] },

      { id:'ren_m12', name:'Danza Suprema de la Llama', learnLevel:55,
        type:'over', target:'single', cost:11, chargeGain:0, damage:9,
        description:'9 de daño. Si el objetivo tiene Quemadura Solar, el daño es triple.',
        effects:[ {type:'damage', value:9}, {type:'triple_if_solar_burn'} ] },

      { id:'ren_m13', name:'Sacrificio del Pilar', learnLevel:60,
        type:'over', target:'ally_aoe', cost:8, chargeGain:0, damage:0,
        description:'Rengoku pierde 6 HP. Todos los aliados ganan Furia, Frenesí y Escudo 6HP.',
        effects:[ {type:'self_damage', value:6}, {type:'buff_team', value:'Furia', duration:2}, {type:'buff_team', value:'Frenesí', duration:2}, {type:'shield_team', value:6} ] },

      { id:'ren_m14', name:'Columna de Fuego', learnLevel:70,
        type:'over', target:'single', cost:13, chargeGain:0, damage:14,
        description:'14 de daño. 60% de crítico. Aplica Quemadura Solar permanente.',
        effects:[ {type:'damage', value:14}, {type:'crit', value:0.6}, {type:'solar_burn', value:8, duration:999} ] },

      { id:'ren_m15', name:'Última Llama', learnLevel:80,
        type:'over', target:'aoe', cost:15, chargeGain:0, damage:0,
        description:'Rengoku canaliza toda su vida. Pierde 10 HP pero causa Quemadura Solar 5T a todos los enemigos y genera 10 cargas.',
        effects:[ {type:'self_damage', value:10}, {type:'solar_burn_aoe', value:10, duration:5}, {type:'generate_charges', value:10} ] },

      { id:'ren_m16', name:'Apocalipsis de Llamas', learnLevel:99,
        type:'over', target:'aoe', cost:18, chargeGain:0, damage:13,
        description:'13 de daño AOE. Activa Quemadura Solar permanente en todos. Rengoku gana Inmortalidad (sobrevive cualquier golpe con 1 HP) por 1 turno.',
        effects:[ {type:'damage_aoe', value:13}, {type:'solar_burn_aoe', value:10, duration:999}, {type:'invincibility', duration:1} ] },
    ],

    passives: [
      { id:'ren_p1', name:'Pilar de las Llamas', learnLevel:1,
        description:'Los ataques básicos de Rengoku siempre aplican Quemadura 3% 1T. Inmune a Quemadura.',
        trigger:'permanent',
        effects:[ {type:'burn_on_basic', value:3, duration:1}, {type:'immunity', value:'burn'} ] },

      { id:'ren_p2', name:'Determinación Absoluta', learnLevel:20,
        description:'Cuando Rengoku recibe daño que lo dejaría en 0 HP, sobrevive con 1 HP una vez por batalla.',
        trigger:'permanent',
        effects:[ {type:'survive_once'} ] },

      { id:'ren_p3', name:'Corazón de Fuego', learnLevel:40,
        description:'Al inicio de cada ronda, genera 2 cargas y aplica Quemadura 5% 1T al enemigo con más HP.',
        trigger:'on_round_start',
        effects:[ {type:'generate_charges', value:2}, {type:'burn_strongest_enemy', value:5, duration:1} ] },

      { id:'ren_p4', name:'Pilar Eterno', learnLevel:60,
        description:'Mientras Rengoku esté vivo, todos los aliados reciben -1 de daño (mínimo 1) de todos los ataques.',
        trigger:'permanent',
        effects:[ {type:'team_damage_reduction', value:1} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  5. DARTH VADER
  //  Especialidades: A) Lado Oscuro (daño/Force Choke)
  //                  B) Señor Sith (CC/intimidación masiva)
  //                  C) Respiración Mecánica (tanque/regeneración)
  // ════════════════════════════════════════════════════════
  'Darth Vader': {
    portrait: '',
    transformPortrait: '',
    hp: 25,
    maxHp: 25,
    speed: 80,
    level: 1,
    xp: 0,
    movePool: ['dv_m1', 'dv_m2', 'dv_m3', 'dv_m4'],
    passiveSlots: ['dv_p1'],

    moves: [
      { id:'dv_m1', name:'Tajo de Sable', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Corte con sable de luz. 3 de daño. El objetivo pierde 1 carga.',
        effects:[ {type:'damage', value:3}, {type:'drain_charges', value:1} ] },

      { id:'dv_m2', name:'Asfixia de la Fuerza', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:2,
        description:'2 de daño. Aplica Silencio (no puede usar Especiales) 2T.',
        effects:[ {type:'damage', value:2}, {type:'silence', value:'special', duration:2} ] },

      { id:'dv_m3', name:'Empuje de la Fuerza', learnLevel:8,
        type:'special', target:'aoe', cost:4, chargeGain:0, damage:2,
        description:'2 de daño AOE. Drena 3 cargas a cada enemigo.',
        effects:[ {type:'damage_aoe', value:2}, {type:'drain_charges_aoe', value:3} ] },

      { id:'dv_m4', name:'Puño de la Fuerza', learnLevel:12,
        type:'special', target:'single', cost:5, chargeGain:0, damage:5,
        description:'5 de daño. 40% de probabilidad de Aturdimiento 1T.',
        effects:[ {type:'damage', value:5}, {type:'stun_chance', value:0.4, duration:1} ] },

      { id:'dv_m5', name:'Aura Oscura', learnLevel:16,
        type:'special', target:'self', cost:4, chargeGain:0, damage:0,
        description:'Activa el Lado Oscuro. Gana Furia y Escudo 5HP por 2 turnos.',
        effects:[ {type:'buff', value:'Furia', duration:2}, {type:'shield', value:5} ] },

      { id:'dv_m6', name:'Relámpago de la Fuerza', learnLevel:20,
        type:'special', target:'single', cost:5, chargeGain:0, damage:4,
        description:'4 de daño. Roba 4 cargas al objetivo y se las transfiere a Vader.',
        effects:[ {type:'steal_charges', value:4} ] },

      { id:'dv_m7', name:'Dominio Mental', learnLevel:25,
        type:'special', target:'single', cost:6, chargeGain:0, damage:0,
        description:'Posee al enemigo. Aplica Posesión 2T y Confusión 2T simultáneamente.',
        effects:[ {type:'possession', duration:2}, {type:'confusion', duration:2} ] },

      { id:'dv_m8', name:'Sable Doble', learnLevel:30,
        type:'special', target:'single', cost:7, chargeGain:0, damage:8,
        description:'Golpea dos veces. Primer golpe 4 daño + Debilitar 1T, segundo golpe 4 daño.',
        effects:[ {type:'damage', value:4}, {type:'weaken', duration:1}, {type:'damage', value:4} ] },

      { id:'dv_m9', name:'Ejecución Sith', learnLevel:35,
        type:'over', target:'single', cost:9, chargeGain:0, damage:7,
        description:'7 de daño. Si el objetivo tiene Silencio o Posesión activa, causa 7 de daño adicional.',
        effects:[ {type:'damage', value:7}, {type:'bonus_if_status', value:7, status:'silence'} ] },

      { id:'dv_m10', name:'Maelstrom Oscuro', learnLevel:45,
        type:'over', target:'aoe', cost:11, chargeGain:0, damage:5,
        description:'5 de daño AOE. Aplica Silencio 2T y drena 3 cargas a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:5}, {type:'silence_aoe', value:'special', duration:2}, {type:'drain_charges_aoe', value:3} ] },

      { id:'dv_m11', name:'Respiración Mecánica', learnLevel:50,
        type:'special', target:'self', cost:5, chargeGain:0, damage:0,
        description:'Sistemas de soporte vitales. Recupera 5 HP y gana Armadura 3T.',
        effects:[ {type:'heal', value:5}, {type:'armor', duration:3} ] },

      { id:'dv_m12', name:'Tormenta de la Fuerza', learnLevel:55,
        type:'over', target:'aoe', cost:12, chargeGain:0, damage:6,
        description:'6 de daño AOE. Aplica Aturdimiento 1T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:6}, {type:'stun_aoe', duration:1} ] },

      { id:'dv_m13', name:'Traición al Maestro', learnLevel:60,
        type:'over', target:'single', cost:10, chargeGain:0, damage:12,
        description:'Golpe traicionero. 12 de daño. Si el objetivo tiene buffs activos, los dispela antes del daño.',
        effects:[ {type:'dispel_buffs'}, {type:'damage', value:12} ] },

      { id:'dv_m14', name:'El Poder del Lado Oscuro', learnLevel:70,
        type:'over', target:'self', cost:8, chargeGain:0, damage:0,
        description:'Canaliza el Lado Oscuro. Gana Furia, Frenesí, Concentración y Armadura por 3 turnos.',
        effects:[ {type:'buff', value:'Furia', duration:3}, {type:'buff', value:'Frenesí', duration:3}, {type:'buff', value:'Concentración', duration:3}, {type:'armor', duration:3} ] },

      { id:'dv_m15', name:'Colapso de la Fuerza', learnLevel:80,
        type:'over', target:'aoe', cost:15, chargeGain:0, damage:9,
        description:'9 de daño AOE. Todos los enemigos pierden sus cargas completamente y quedan en Silencio 3T.',
        effects:[ {type:'damage_aoe', value:9}, {type:'drain_all_charges_aoe'}, {type:'silence_aoe', value:'all', duration:3} ] },

      { id:'dv_m16', name:'Yo Soy Tu Padre', learnLevel:99,
        type:'over', target:'single', cost:18, chargeGain:0, damage:0,
        description:'El golpe psicológico definitivo. El objetivo pierde todas sus cargas, recibe Posesión permanente y Miedo 3T. Vader recupera 8 HP.',
        effects:[ {type:'drain_all_charges'}, {type:'possession', duration:999}, {type:'fear', duration:3}, {type:'heal', value:8} ] },
    ],

    passives: [
      { id:'dv_p1', name:'Presencia Oscura', learnLevel:1,
        description:'Vader es inmune a Miedo y Confusión. Al inicio de la batalla obtiene Aura Oscura permanente (enemies -1 carga al atacarle).',
        trigger:'permanent',
        effects:[ {type:'immunity', value:'fear'}, {type:'immunity', value:'confusion'}, {type:'aura_drain_on_hit', value:1} ] },

      { id:'dv_p2', name:'Lado Oscuro', learnLevel:20,
        description:'Cuando Vader usa un movimiento Especial u Over, todos los enemigos pierden 1 carga adicional.',
        trigger:'on_special_use',
        effects:[ {type:'drain_charges_all_enemies', value:1} ] },

      { id:'dv_p3', name:'Armadura Sith', learnLevel:40,
        description:'Vader recibe -2 de daño de todos los ataques físicos (mínimo 1). Inmune a Sangrado.',
        trigger:'permanent',
        effects:[ {type:'damage_reduction_flat', value:2}, {type:'immunity', value:'bleed'} ] },

      { id:'dv_p4', name:'El Elegido Caído', learnLevel:60,
        description:'Cuando Vader elimina a un enemigo, recupera 5 HP y gana 5 cargas.',
        trigger:'on_kill',
        effects:[ {type:'heal', value:5}, {type:'generate_charges', value:5} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  6. SUPERMAN
  //  Especialidades: A) Hombre de Acero (tanque/provocación)
  //                  B) Visión de Calor (daño/quemadura solar)
  //                  C) Velocidad Kryptoniana (multi-hit/esquiva)
  // ════════════════════════════════════════════════════════
  'Superman': {
    portrait: '',
    transformPortrait: '',
    hp: 30,
    maxHp: 30,
    speed: 85,
    level: 1,
    xp: 0,
    movePool: ['sup_m1', 'sup_m2', 'sup_m3', 'sup_m4'],
    passiveSlots: ['sup_p1'],

    moves: [
      { id:'sup_m1', name:'Puño de Acero', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'3 de daño. 20% de probabilidad de Aturdimiento 1T.',
        effects:[ {type:'damage', value:3}, {type:'stun_chance', value:0.2, duration:1} ] },

      { id:'sup_m2', name:'Visión de Calor', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'3 de daño. Aplica Quemadura Solar 1T (bloquea curas).',
        effects:[ {type:'damage', value:3}, {type:'solar_burn', value:3, duration:1} ] },

      { id:'sup_m3', name:'Aliento Ártico', learnLevel:8,
        type:'special', target:'aoe', cost:4, chargeGain:0, damage:2,
        description:'2 de daño AOE. Aplica Congelación 1T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:2}, {type:'freeze_aoe', duration:1} ] },

      { id:'sup_m4', name:'Vuelo a Supersonico', learnLevel:12,
        type:'special', target:'single', cost:5, chargeGain:0, damage:6,
        description:'Embiste al objetivo a velocidad supersónica. 6 de daño. Ignora esquiva.',
        effects:[ {type:'damage_piercing', value:6} ] },

      { id:'sup_m5', name:'Escudo de Invulnerabilidad', learnLevel:16,
        type:'special', target:'self', cost:4, chargeGain:0, damage:0,
        description:'Activa la piel de acero. Gana Escudo 8HP y Armadura 2T.',
        effects:[ {type:'shield', value:8}, {type:'armor', duration:2} ] },

      { id:'sup_m6', name:'Visión de Calor: Carga', learnLevel:20,
        type:'special', target:'single', cost:6, chargeGain:0, damage:5,
        description:'5 de daño. Aplica Quemadura Solar 3T. Si el objetivo tiene Congelación, daño doble.',
        effects:[ {type:'damage', value:5}, {type:'solar_burn', value:4, duration:3}, {type:'double_if_frozen'} ] },

      { id:'sup_m7', name:'Grito Sónico', learnLevel:25,
        type:'special', target:'aoe', cost:5, chargeGain:0, damage:3,
        description:'3 de daño AOE. Aplica Silencio (Over) 2T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:3}, {type:'silence_aoe', value:'over', duration:2} ] },

      { id:'sup_m8', name:'Choque de Puños', learnLevel:30,
        type:'over', target:'single', cost:9, chargeGain:0, damage:10,
        description:'10 de daño. Rompe el escudo del objetivo antes del daño.',
        effects:[ {type:'break_shield'}, {type:'damage', value:10} ] },

      { id:'sup_m9', name:'Absorción Solar', learnLevel:35,
        type:'special', target:'self', cost:3, chargeGain:3, damage:0,
        description:'Carga energía solar. Recupera 4 HP y genera 3 cargas.',
        effects:[ {type:'heal', value:4}, {type:'generate_charges', value:3} ] },

      { id:'sup_m10', name:'Visión de Calor: Barrida', learnLevel:45,
        type:'over', target:'aoe', cost:10, chargeGain:0, damage:5,
        description:'5 de daño AOE. Aplica Quemadura Solar 2T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:5}, {type:'solar_burn_aoe', value:5, duration:2} ] },

      { id:'sup_m11', name:'Superman Prime', learnLevel:50,
        type:'over', target:'self', cost:11, chargeGain:0, damage:0,
        description:'Transforma a Superman. Gana Furia, Escudo 10HP, Armadura y Esquiva Área por 3 turnos.',
        effects:[ {type:'buff', value:'Furia', duration:3}, {type:'shield', value:10}, {type:'armor', duration:3}, {type:'buff', value:'Esquiva Area', duration:3}, {type:'transform', value:'supermanPrimeMode'} ] },

      { id:'sup_m12', name:'Velocidad Kryptoniana', learnLevel:55,
        type:'special', target:'single', cost:7, chargeGain:0, damage:4,
        description:'Golpea 3 veces al mismo objetivo. 4 de daño por golpe. 100% de velocidad de ataque.',
        effects:[ {type:'damage_multi_target', value:4, hits:3} ] },

      { id:'sup_m13', name:'Defensa del Mundo', learnLevel:60,
        type:'special', target:'ally_aoe', cost:7, chargeGain:0, damage:0,
        description:'Escuda a todos los aliados (Escudo 6HP) y los limpia de 2 debuffs.',
        effects:[ {type:'shield_team', value:6}, {type:'cleanse_team', value:2} ] },

      { id:'sup_m14', name:'Explosión de Calor', learnLevel:70,
        type:'over', target:'aoe', cost:13, chargeGain:0, damage:8,
        description:'8 de daño AOE. Quemadura Solar permanente a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:8}, {type:'solar_burn_aoe', value:6, duration:999} ] },

      { id:'sup_m15', name:'El Más Grande Héroe', learnLevel:80,
        type:'over', target:'ally_aoe', cost:10, chargeGain:0, damage:0,
        description:'Cura a todos los aliados 6 HP, otorga Furia y Frenesí 2T. Superman pierde 6 HP.',
        effects:[ {type:'heal_team', value:6}, {type:'buff_team', value:'Furia', duration:2}, {type:'buff_team', value:'Frenesí', duration:2}, {type:'self_damage', value:6} ] },

      { id:'sup_m16', name:'Puño del Amanecer', learnLevel:99,
        type:'over', target:'single', cost:18, chargeGain:0, damage:20,
        description:'El golpe definitivo. 20 de daño. Ignora todo. El objetivo queda con Quemadura Solar permanente e incapaz de usar Over por 3T.',
        effects:[ {type:'damage_true', value:20}, {type:'solar_burn', value:10, duration:999}, {type:'silence', value:'over', duration:3} ] },
    ],

    passives: [
      { id:'sup_p1', name:'Hombre de Acero', learnLevel:1,
        description:'Superman tiene Provocación permanente. Recibe -1 de daño de todos los ataques (mínimo 1).',
        trigger:'permanent',
        effects:[ {type:'permanent_buff', value:'Provocacion'}, {type:'damage_reduction_flat', value:1} ] },

      { id:'sup_p2', name:'Poder Solar', learnLevel:20,
        description:'Al inicio de cada ronda, Superman recupera 2 HP.',
        trigger:'on_round_start',
        effects:[ {type:'heal', value:2} ] },

      { id:'sup_p3', name:'Invulnerabilidad', learnLevel:40,
        description:'Superman es inmune a Veneno, Sangrado y Quemadura. Sus ataques básicos ignoran Armadura.',
        trigger:'permanent',
        effects:[ {type:'immunity', value:'poison'}, {type:'immunity', value:'bleed'}, {type:'immunity', value:'burn'}, {type:'basic_pierces_armor'} ] },

      { id:'sup_p4', name:'Último Hijo de Krypton', learnLevel:60,
        description:'Cuando Superman tiene 10 HP o menos, todos sus ataques hacen daño doble y es inmune a Quemadura Solar.',
        trigger:'permanent',
        effects:[ {type:'double_damage_if_hp_below', threshold:10}, {type:'immunity_conditional', value:'solar_burn', condition:'hp_below_10'} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  7. MADARA UCHIHA
  //  Especialidades: A) Rinnegan (daño/manipulación de cargas)
  //                  B) Susano'o (defensa/contraataque masivo)
  //                  C) Modo Rikudō (poder absoluto/transformación)
  // ════════════════════════════════════════════════════════
  'Madara Uchiha': {
    portrait: '',
    transformPortrait: '',
    hp: 24,
    maxHp: 24,
    speed: 87,
    level: 1,
    xp: 0,
    movePool: ['mad_m1', 'mad_m2', 'mad_m3', 'mad_m4'],
    passiveSlots: ['mad_p1'],

    moves: [
      { id:'mad_m1', name:'Llamas de Amaterasu', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Llamas negras. 3 de daño. Aplica Quemadura Solar 1T.',
        effects:[ {type:'damage', value:3}, {type:'solar_burn', value:4, duration:1} ] },

      { id:'mad_m2', name:'Magatama de Chakra', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:4,
        description:'4 de daño. Roba 2 cargas al objetivo.',
        effects:[ {type:'damage', value:4}, {type:'steal_charges', value:2} ] },

      { id:'mad_m3', name:'Susano\'o: Impacto', learnLevel:8,
        type:'special', target:'single', cost:4, chargeGain:0, damage:5,
        description:'Golpe del guerrero espiritual. 5 de daño. Madara gana Escudo 4HP.',
        effects:[ {type:'damage', value:5}, {type:'shield', value:4} ] },

      { id:'mad_m4', name:'Chibaku Tensei', learnLevel:12,
        type:'special', target:'aoe', cost:5, chargeGain:0, damage:4,
        description:'Crea un planeta de gravedad. 4 de daño AOE. Drena 3 cargas a cada enemigo.',
        effects:[ {type:'damage_aoe', value:4}, {type:'drain_charges_aoe', value:3} ] },

      { id:'mad_m5', cname:'Tsukuyomi', learnLevel:16,
        type:'special', target:'single', cost:5, chargeGain:0, damage:3,
        description:'Ilusión mental. 3 de daño. Aplica Posesión 2T y Confusión 1T.',
        effects:[ {type:'damage', value:3}, {type:'possession', duration:2}, {type:'confusion', duration:1} ] },

      { id:'mad_m5', name:'Tsukuyomi', learnLevel:16,
        type:'special', target:'single', cost:5, chargeGain:0, damage:3,
        description:'Ilusión mental. 3 de daño. Aplica Posesión 2T y Confusión 1T.',
        effects:[ {type:'damage', value:3}, {type:'possession', duration:2}, {type:'confusion', duration:1} ] },

      { id:'mad_m6', name:'Susano\'o Perfecto', learnLevel:20,
        type:'special', target:'self', cost:6, chargeGain:0, damage:0,
        description:'Activa el Susano\'o completo. Gana Escudo 8HP, Armadura y Contraataque 2T.',
        effects:[ {type:'shield', value:8}, {type:'armor', duration:2}, {type:'buff', value:'Contraataque', duration:2} ] },

      { id:'mad_m7', name:'Meteorito de Chakra', learnLevel:25,
        type:'over', target:'aoe', cost:9, chargeGain:0, damage:6,
        description:'6 de daño AOE. 30% de probabilidad de Aturdimiento 1T por objetivo.',
        effects:[ {type:'damage_aoe', value:6}, {type:'stun_chance_aoe', value:0.3, duration:1} ] },

      { id:'mad_m8', name:'Rinnegan: Atracción', learnLevel:30,
        type:'special', target:'aoe', cost:7, chargeGain:0, damage:0,
        description:'Drena TODAS las cargas de todos los enemigos. La mitad se transfiere a Madara.',
        effects:[ {type:'drain_all_charges_aoe'}, {type:'half_to_self'} ] },

      { id:'mad_m9', name:'Gojo Mokuton', learnLevel:35,
        type:'over', target:'single', cost:10, chargeGain:0, damage:9,
        description:'9 de daño. Aplica todos los debuffs disponibles: Quemadura Solar, Posesión, Silencio, Sangrado.',
        effects:[ {type:'solar_burn', value:5, duration:2}, {type:'possession', duration:2}, {type:'silence', value:'all', duration:1}, {type:'bleed', value:2, duration:2} ] },

      { id:'mad_m10', name:'Modo Rikudō', learnLevel:45,
        type:'over', target:'self', cost:12, chargeGain:0, damage:0,
        description:'Transforma a Madara en Sabio de los Seis Caminos. Costo de habilidades reducido a la mitad por 3T. +3 daño en todos los ataques.',
        effects:[ {type:'transform', value:'rikudoMode'}, {type:'cost_reduction', value:0.5, duration:3}, {type:'damage_boost', value:3, duration:3} ] },

      { id:'mad_m11', name:'Chibaku Tensei Colosal', learnLevel:50,
        type:'over', target:'aoe', cost:11, chargeGain:0, damage:8,
        description:'8 de daño AOE. Aplica Mega Aturdimiento 2T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:8}, {type:'mega_stun_aoe', duration:2} ] },

      { id:'mad_m12', name:'Susano\'o: Espada Totsuka', learnLevel:55,
        type:'over', target:'single', cost:12, chargeGain:0, damage:12,
        description:'12 de daño. Elimina permanentemente todos los buffs del objetivo. No pueden volver a aplicarse este turno.',
        effects:[ {type:'damage', value:12}, {type:'dispel_and_block_buffs', duration:1} ] },

      { id:'mad_m13', name:'Amaterasu: Llamas Eternas', learnLevel:60,
        type:'over', target:'single', cost:10, chargeGain:0, damage:7,
        description:'7 de daño. Aplica Quemadura Solar PERMANENTE. Las llamas no pueden apagarse.',
        effects:[ {type:'damage', value:7}, {type:'solar_burn', value:8, duration:999} ] },

      { id:'mad_m14', name:'Infinite Tsukuyomi', learnLevel:70,
        type:'over', target:'aoe', cost:15, chargeGain:0, damage:0,
        description:'Atrapa a todos los enemigos en una ilusión. Aplica Posesión 3T, Confusión 2T y Silencio 2T a todos.',
        effects:[ {type:'possession_aoe', duration:3}, {type:'confusion_aoe', duration:2}, {type:'silence_aoe', value:'all', duration:2} ] },

      { id:'mad_m15', name:'Susano\'o: Armadura Perfecta', learnLevel:80,
        type:'over', target:'self', cost:14, chargeGain:0, damage:0,
        description:'Activación máxima del Susano\'o. Gana Escudo 15HP, Armadura, Contraataque, Esquiva Área y Regeneración 15% por 3T.',
        effects:[ {type:'shield', value:15}, {type:'armor', duration:3}, {type:'buff', value:'Contraataque', duration:3}, {type:'buff', value:'Esquiva Area', duration:3}, {type:'regen', value:15, duration:3} ] },

      { id:'mad_m16', name:'Jutsus de los Seis Caminos', learnLevel:99,
        type:'over', target:'aoe', cost:20, chargeGain:0, damage:14,
        description:'El poder máximo de Madara. 14 de daño AOE. Drena todas las cargas de todos. Aplica Quemadura Solar permanente, Posesión y Silencio 3T a todos.',
        effects:[ {type:'damage_aoe', value:14}, {type:'drain_all_charges_aoe'}, {type:'solar_burn_aoe', value:10, duration:999}, {type:'possession_aoe', duration:3}, {type:'silence_aoe', value:'all', duration:3} ] },
    ],

    passives: [
      { id:'mad_p1', name:'Ojos del Rinnegan', learnLevel:1,
        description:'Al inicio de cada turno, Madara roba 1 carga al enemigo con más cargas.',
        trigger:'on_turn_start',
        effects:[ {type:'steal_from_richest', value:1} ] },

      { id:'mad_p2', name:'Susano\'o Pasivo', learnLevel:20,
        description:'Madara recibe -2 de daño de todos los ataques (mínimo 1). Inmune a Posesión y Confusión.',
        trigger:'permanent',
        effects:[ {type:'damage_reduction_flat', value:2}, {type:'immunity', value:'possession'}, {type:'immunity', value:'confusion'} ] },

      { id:'mad_p3', name:'Rikudō: Poder Supremo', learnLevel:40,
        description:'Cuando Madara usa Modo Rikudō, todos sus aliados reciben 3 cargas y Furia 2T.',
        trigger:'on_transform',
        effects:[ {type:'charges_team_on_transform', value:3}, {type:'buff_team_on_transform', value:'Furia', duration:2} ] },

      { id:'mad_p4', name:'El Dios de los Ninja', learnLevel:60,
        description:'Cuando Madara tiene el Modo Rikudō activo, es inmune a todos los debuffs y su daño se duplica.',
        trigger:'permanent',
        effects:[ {type:'immunity_all_when_rikudo'}, {type:'double_damage_when_rikudo'} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  8. RAGNAR LOTHBROK
  //  Especialidades: A) Berserker (daño/frenesí/autosacrificio)
  //                  B) Jefe Vikingo (soporte/aura de guerra)
  //                  C) Conquistador (robo/debilitamiento)
  // ════════════════════════════════════════════════════════
  'Ragnar Lothbrok': {
    portrait: '',
    transformPortrait: '',
    hp: 23,
    maxHp: 23,
    speed: 82,
    level: 1,
    xp: 0,
    movePool: ['rag_m1', 'rag_m2', 'rag_m3', 'rag_m4'],
    passiveSlots: ['rag_p1'],

    moves: [
      { id:'rag_m1', name:'Hacha Vikinga', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Tajo con hacha de guerra. 3 de daño. Aplica Sangrado 1HP 2T.',
        effects:[ {type:'damage', value:3}, {type:'bleed', value:1, duration:2} ] },

      { id:'rag_m2', name:'Golpe de Escudo', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:2,
        description:'2 de daño. Aturdimiento 1T con 50% de probabilidad.',
        effects:[ {type:'damage', value:2}, {type:'stun_chance', value:0.5, duration:1} ] },

      { id:'rag_m3', name:'Furia Nórdica', learnLevel:8,
        type:'special', target:'self', cost:3, chargeGain:0, damage:0,
        description:'Entra en estado Berserker. Gana Frenesí y Furia 3T. Se pierde Armadura si la tenía.',
        effects:[ {type:'buff', value:'Frenesí', duration:3}, {type:'buff', value:'Furia', duration:3}, {type:'remove_self_buff', value:'Armadura'} ] },

      { id:'rag_m4', name:'Carga de Guerra', learnLevel:12,
        type:'special', target:'single', cost:5, chargeGain:0, damage:6,
        description:'Embiste al enemigo. 6 de daño. El propio Ragnar recibe 1 de daño (sacrificio de guerra).',
        effects:[ {type:'damage', value:6}, {type:'self_damage', value:1} ] },

      { id:'rag_m5', name:'Grito de Batalla', learnLevel:16,
        type:'special', target:'ally_aoe', cost:4, chargeGain:0, damage:0,
        description:'El grito motiva al equipo. Otorga Furia 2T y 2 cargas a todos los aliados.',
        effects:[ {type:'buff_team', value:'Furia', duration:2}, {type:'generate_charges_team', value:2} ] },

      { id:'rag_m6', name:'Saqueo', learnLevel:20,
        type:'special', target:'single', cost:5, chargeGain:0, damage:4,
        description:'4 de daño. Roba 3 cargas al objetivo. Aplica Debilitado 2T.',
        effects:[ {type:'damage', value:4}, {type:'steal_charges', value:3}, {type:'weaken', duration:2} ] },

      { id:'rag_m7', name:'Espíritu del Valhalla', learnLevel:25,
        type:'special', target:'self', cost:5, chargeGain:0, damage:0,
        description:'Canaliza el poder de los dioses nórdicos. Regeneración 20% 3T y Escudo 5HP.',
        effects:[ {type:'regen', value:20, duration:3}, {type:'shield', value:5} ] },

      { id:'rag_m8', name:'Invasión Vikinga', learnLevel:30,
        type:'over', target:'aoe', cost:9, chargeGain:0, damage:4,
        description:'4 de daño AOE. Aplica Sangrado 2HP 3T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:4}, {type:'bleed_aoe', value:2, duration:3} ] },

      { id:'rag_m9', name:'Berserker Total', learnLevel:35,
        type:'over', target:'self', cost:8, chargeGain:0, damage:0,
        description:'Estado Berserker extremo. Frenesí + Furia 4T. Ragnar pierde 4 HP pero sus ataques ignoran armadura y escudo.',
        effects:[ {type:'buff', value:'Frenesí', duration:4}, {type:'buff', value:'Furia', duration:4}, {type:'self_damage', value:4}, {type:'buff', value:'Penetración', duration:4} ] },

      { id:'rag_m10', name:'Conquista del Norte', learnLevel:45,
        type:'over', target:'aoe', cost:10, chargeGain:0, damage:5,
        description:'5 de daño AOE. Drena 2 cargas de cada enemigo. Cada carga robada cura 1 HP a Ragnar.',
        effects:[ {type:'damage_aoe', value:5}, {type:'drain_charges_lifesteal_aoe', value:2} ] },

      { id:'rag_m11', name:'Llamada de Odin', learnLevel:50,
        type:'over', target:'self', cost:11, chargeGain:0, damage:0,
        description:'Odin bendice a Ragnar. Regeneración 25% 4T, Armadura 4T y genera 6 cargas.',
        effects:[ {type:'regen', value:25, duration:4}, {type:'armor', duration:4}, {type:'generate_charges', value:6} ] },

      { id:'rag_m12', name:'Masacre Nórdica', learnLevel:55,
        type:'over', target:'aoe', cost:11, chargeGain:0, damage:7,
        description:'7 de daño AOE. Por cada enemigo eliminado en este ataque, Ragnar recupera 4 HP.',
        effects:[ {type:'damage_aoe', value:7}, {type:'heal_on_kill_aoe', value:4} ] },

      { id:'rag_m13', name:'Legado Vikingo', learnLevel:60,
        type:'over', target:'ally_aoe', cost:8, chargeGain:0, damage:0,
        description:'Inspira al equipo con leyendas vikingas. Todos los aliados ganan Frenesí, Furia y Regeneración 15% por 3T.',
        effects:[ {type:'buff_team', value:'Frenesí', duration:3}, {type:'buff_team', value:'Furia', duration:3}, {type:'regen_team', value:15, duration:3} ] },

      { id:'rag_m14', name:'Tormenta del Norte', learnLevel:70,
        type:'over', target:'aoe', cost:13, chargeGain:0, damage:9,
        description:'9 de daño AOE. Aplica Sangrado 3HP 3T a todos. Ragnar recupera 1 HP por cada sangrado aplicado.',
        effects:[ {type:'damage_aoe', value:9}, {type:'bleed_aoe', value:3, duration:3}, {type:'heal_per_bleed_applied', value:1} ] },

      { id:'rag_m15', name:'Rey del Norte', learnLevel:80,
        type:'over', target:'self', cost:12, chargeGain:0, damage:0,
        description:'Ragnar asume su papel como rey. Todos los aliados obtienen Escudo 8HP, Frenesí y Furia 3T. Ragnar obtiene doble de todos estos efectos.',
        effects:[ {type:'shield_team', value:8}, {type:'buff_team', value:'Frenesí', duration:3}, {type:'buff_team', value:'Furia', duration:3}, {type:'self_double_effects'} ] },

      { id:'rag_m16', name:'Ragnarök', learnLevel:99,
        type:'over', target:'aoe', cost:18, chargeGain:0, damage:12,
        description:'El fin del mundo vikingo. 12 de daño AOE. Aplica Sangrado 4HP, Quemadura 3HP y Debilitado permanentes. Ragnar pierde 8 HP.',
        effects:[ {type:'damage_aoe', value:12}, {type:'bleed_aoe', value:4, duration:999}, {type:'burn_aoe', value:3, duration:999}, {type:'weaken_aoe', duration:999}, {type:'self_damage', value:8} ] },
    ],

    passives: [
      { id:'rag_p1', name:'Sed de Batalla', learnLevel:1,
        description:'Cuando Ragnar recibe daño, genera 1 carga adicional. Si está en Frenesí, genera 2.',
        trigger:'on_hit_received',
        effects:[ {type:'generate_charges_on_hit', value:1}, {type:'bonus_charges_if_frenzy', value:1} ] },

      { id:'rag_p2', name:'Corazón Vikingo', learnLevel:20,
        description:'Ragnar es inmune a Miedo. Al inicio de cada ronda recupera 2 HP.',
        trigger:'permanent',
        effects:[ {type:'immunity', value:'fear'}, {type:'regen_flat_per_round', value:2} ] },

      { id:'rag_p3', name:'Líder de Hombres', learnLevel:40,
        description:'Cuando un aliado muere, Ragnar gana Frenesí 2T y Furia 2T.',
        trigger:'on_ally_death',
        effects:[ {type:'buff', value:'Frenesí', duration:2}, {type:'buff', value:'Furia', duration:2} ] },

      { id:'rag_p4', name:'Guerrero Inmortal', learnLevel:60,
        description:'Si Ragnar muere con Frenesí o Furia activos, se levanta con 4 HP una vez por batalla.',
        trigger:'permanent',
        effects:[ {type:'revive_if_buffed', value:4} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  9. GANDALF
  //  Especialidades: A) Mago de Luz (soporte/cura/limpieza)
  //                  B) El Blanco (daño mágico/CC)
  //                  C) Istari (invocación/escudo global)
  // ════════════════════════════════════════════════════════
  'Gandalf': {
    portrait: '',
    transformPortrait: '',
    hp: 20,
    maxHp: 20,
    speed: 76,
    level: 1,
    xp: 0,
    movePool: ['gan_m1', 'gan_m2', 'gan_m3', 'gan_m4'],
    passiveSlots: ['gan_p1'],

    moves: [
      { id:'gan_m1', name:'Bastón Mágico', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Golpe mágico. 3 de daño. 30% de probabilidad de Aturdimiento 1T.',
        effects:[ {type:'damage', value:3}, {type:'stun_chance', value:0.3, duration:1} ] },

      { id:'gan_m2', name:'Rayo Ístari', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:4,
        description:'Rayo de poder mágico. 4 de daño. Elimina 1 buff del objetivo.',
        effects:[ {type:'damage', value:4}, {type:'dispel_buffs', value:1} ] },

      { id:'gan_m3', name:'Luz de Earendil', learnLevel:8,
        type:'special', target:'ally_single', cost:3, chargeGain:0, damage:0,
        description:'Cura a un aliado 6 HP y elimina 2 debuffs de él.',
        effects:[ {type:'heal', value:6}, {type:'cleanse_ally', value:2} ] },

      { id:'gan_m4', name:'¡No Pasarás!', learnLevel:12,
        type:'special', target:'self', cost:4, chargeGain:0, damage:0,
        description:'Barrera de poder. Gana Escudo 8HP y Armadura 2T. Los atacantes reciben Aturdimiento 1T con 30% de prob.',
        effects:[ {type:'shield', value:8}, {type:'armor', duration:2}, {type:'buff', value:'Aura Aturdimiento', duration:2} ] },

      { id:'gan_m5', name:'Fuego de Anor', learnLevel:16,
        type:'special', target:'aoe', cost:5, chargeGain:0, damage:4,
        description:'4 de daño AOE. Elimina Sigilo de todos los enemigos.',
        effects:[ {type:'damage_aoe', value:4}, {type:'remove_stealth_aoe'} ] },

      { id:'gan_m6', name:'Sabiduría del Istari', learnLevel:20,
        type:'special', target:'ally_aoe', cost:5, chargeGain:0, damage:0,
        description:'Purifica a todo el equipo. Elimina todos los debuffs de todos los aliados y otorga Armadura 2T.',
        effects:[ {type:'cleanse_team', value:999}, {type:'armor_team', duration:2} ] },

      { id:'gan_m7', name:'Revelación del Blanco', learnLevel:25,
        type:'special', target:'self', cost:5, chargeGain:0, damage:0,
        description:'Se revela como Gandalf el Blanco. Gana Regeneración 15%, Concentración y Esquiva Área 3T.',
        effects:[ {type:'regen', value:15, duration:3}, {type:'buff', value:'Concentración', duration:3}, {type:'buff', value:'Esquiva Area', duration:3} ] },

      { id:'gan_m8', name:'Tormenta de Relámpagos', learnLevel:30,
        type:'over', target:'aoe', cost:9, chargeGain:0, damage:5,
        description:'5 de daño AOE. Aplica Aturdimiento 1T a todos los enemigos. 40% de prob de Mega Aturdimiento.',
        effects:[ {type:'damage_aoe', value:5}, {type:'stun_aoe', duration:1}, {type:'mega_stun_chance_aoe', value:0.4, duration:2} ] },

      { id:'gan_m9', name:'Escudo de Valar', learnLevel:35,
        type:'special', target:'ally_aoe', cost:7, chargeGain:0, damage:0,
        description:'Escudo mágico grupal. Otorga Escudo 6HP a todos los aliados y Regeneración 10% 2T.',
        effects:[ {type:'shield_team', value:6}, {type:'regen_team', value:10, duration:2} ] },

      { id:'gan_m10', name:'Palabra de Poder', learnLevel:45,
        type:'over', target:'single', cost:10, chargeGain:0, damage:0,
        description:'Aplica TODOS los debuffs de control al objetivo: Posesión, Confusión, Miedo, Aturdimiento 2T.',
        effects:[ {type:'possession', duration:2}, {type:'confusion', duration:2}, {type:'fear', duration:2}, {type:'mega_stun', duration:2} ] },

      { id:'gan_m11', name:'Resurrección del Blanco', learnLevel:50,
        type:'over', target:'ally_single', cost:12, chargeGain:0, damage:0,
        description:'Revive a un aliado caído con 10 HP, 8 cargas y limpia todos sus debuffs.',
        effects:[ {type:'revive', value:10}, {type:'generate_charges_target', value:8}, {type:'cleanse_target', value:999} ] },

      { id:'gan_m12', name:'Varita de Orthanc', learnLevel:55,
        type:'over', target:'single', cost:11, chargeGain:0, damage:10,
        description:'10 de daño mágico. Dispela todos los buffs del objetivo. El objetivo no puede recibir buffs 2T.',
        effects:[ {type:'damage', value:10}, {type:'dispel_buffs'}, {type:'block_buffs', duration:2} ] },

      { id:'gan_m13', name:'Montaña de Fuego', learnLevel:60,
        type:'over', target:'aoe', cost:12, chargeGain:0, damage:7,
        description:'7 de daño AOE. Aplica Quemadura 10% 3T a todos. Elimina todos los escudos enemigos.',
        effects:[ {type:'damage_aoe', value:7}, {type:'burn_pct_aoe', value:10, duration:3}, {type:'break_shields_aoe'} ] },

      { id:'gan_m14', name:'Tú No Pasarás: Versión Blanca', learnLevel:70,
        type:'over', target:'ally_aoe', cost:10, chargeGain:0, damage:0,
        description:'Barrera máxima. Todos los aliados ganan Escudo 10HP, Armadura 3T, Esquiva Área 2T y se curan 4 HP.',
        effects:[ {type:'shield_team', value:10}, {type:'armor_team', duration:3}, {type:'buff_team', value:'Esquiva Area', duration:2}, {type:'heal_team', value:4} ] },

      { id:'gan_m15', name:'Poder de los Valar', learnLevel:80,
        type:'over', target:'aoe', cost:15, chargeGain:0, damage:0,
        description:'Llama al poder de los dioses. Aplica Aturdimiento 3T y Silencio total 3T a todos los enemigos. Cura al equipo completo 8 HP.',
        effects:[ {type:'stun_aoe', duration:3}, {type:'silence_aoe', value:'all', duration:3}, {type:'heal_team', value:8} ] },

      { id:'gan_m16', name:'El Istari Eterno', learnLevel:99,
        type:'over', target:'ally_aoe', cost:20, chargeGain:0, damage:0,
        description:'El poder definitivo del mago. Resucita a TODOS los aliados caídos con 6 HP. Todos los vivos se curan 12 HP. Todos los aliados ganan Escudo 12HP y Armadura permanente este turno.',
        effects:[ {type:'revive_all_dead', value:6}, {type:'heal_team', value:12}, {type:'shield_team', value:12}, {type:'armor_team', duration:1} ] },
    ],

    passives: [
      { id:'gan_p1', name:'Sabiduría Milenaria', learnLevel:1,
        description:'Gandalf es inmune a Miedo, Confusión y Posesión. Sus habilidades de curación curan 2 HP adicionales.',
        trigger:'permanent',
        effects:[ {type:'immunity', value:'fear'}, {type:'immunity', value:'confusion'}, {type:'immunity', value:'possession'}, {type:'heal_bonus', value:2} ] },

      { id:'gan_p2', name:'Luz del Amanecer', learnLevel:20,
        description:'Al inicio de cada ronda, limpia 1 debuff de un aliado aleatorio y le otorga 2 cargas.',
        trigger:'on_round_start',
        effects:[ {type:'cleanse_random_ally', value:1}, {type:'charges_random_ally', value:2} ] },

      { id:'gan_p3', name:'El Gris y el Blanco', learnLevel:40,
        description:'La primera vez que Gandalf llega a 0 HP, regresa como Gandalf el Blanco con 8 HP, Regeneración 20% 3T y Escudo 8HP.',
        trigger:'permanent',
        effects:[ {type:'revive_as_white', hp:8} ] },

      { id:'gan_p4', name:'Conocimiento de los Anillos', learnLevel:60,
        description:'Gandalf ve a través de los buffs. Al inicio de su turno, todos los enemigos con Sigilo pierden el Sigilo y reciben Debilitado 1T.',
        trigger:'on_turn_start',
        effects:[ {type:'remove_stealth_aoe'}, {type:'weaken_aoe', duration:1} ] },
    ],
  },

  // ════════════════════════════════════════════════════════
  //  10. MUZAN KIBUTSUJI
  //  Especialidades: A) Demonio Supremo (daño/veneno/sangrado)
  //                  B) Transformación (cambio de forma/buffs)
  //                  C) Control Demoniaco (CC/posesión/ejercito)
  // ════════════════════════════════════════════════════════
  'Muzan Kibutsuji': {
    portrait: '',
    transformPortrait: '',
    hp: 22,
    maxHp: 22,
    speed: 94,
    level: 1,
    xp: 0,
    movePool: ['muz_m1', 'muz_m2', 'muz_m3', 'muz_m4'],
    passiveSlots: ['muz_p1'],

    moves: [
      { id:'muz_m1', name:'Garra Demoniaca', learnLevel:1,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:3,
        description:'Ataque rápido. 3 de daño. Aplica Sangrado 1HP 2T.',
        effects:[ {type:'damage', value:3}, {type:'bleed', value:1, duration:2} ] },

      { id:'muz_m2', name:'Veneno Demoniaco', learnLevel:4,
        type:'basic', target:'single', cost:0, chargeGain:2, damage:2,
        description:'2 de daño. Aplica Veneno 3HP 2T.',
        effects:[ {type:'damage', value:2}, {type:'poison', value:3, duration:2} ] },

      { id:'muz_m3', name:'Tentáculos de Sangre', learnLevel:8,
        type:'special', target:'aoe', cost:4, chargeGain:0, damage:3,
        description:'3 de daño AOE. Aplica Sangrado 2HP 2T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:3}, {type:'bleed_aoe', value:2, duration:2} ] },

      { id:'muz_m4', name:'Transmutación Celular', learnLevel:12,
        type:'special', target:'self', cost:4, chargeGain:0, damage:0,
        description:'Regeneración celular. Recupera 5 HP y elimina 2 de sus propios debuffs.',
        effects:[ {type:'heal', value:5}, {type:'cleanse_self', value:2} ] },

      { id:'muz_m5', name:'Lluvia de Veneno', learnLevel:16,
        type:'special', target:'aoe', cost:5, chargeGain:0, damage:2,
        description:'2 de daño AOE. Aplica Veneno 2HP 3T a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:2}, {type:'poison_aoe', value:2, duration:3} ] },

      { id:'muz_m6', name:'Control Mental Demoniaco', learnLevel:20,
        type:'special', target:'single', cost:5, chargeGain:0, damage:0,
        description:'Toma control del enemigo. Aplica Posesión 3T y Confusión 2T.',
        effects:[ {type:'possession', duration:3}, {type:'confusion', duration:2} ] },

      { id:'muz_m7', name:'Forma del Artista', learnLevel:25,
        type:'special', target:'self', cost:6, chargeGain:0, damage:0,
        description:'Muzan adopta su forma de artista. Gana Sigilo 2T, Esquiva Área 1T y Regeneración 15% 2T.',
        effects:[ {type:'buff', value:'Sigilo', duration:2}, {type:'buff', value:'Esquiva Area', duration:1}, {type:'regen', value:15, duration:2} ] },

      { id:'muz_m8', name:'Plaga Demoniaca', learnLevel:30,
        type:'over', target:'single', cost:8, chargeGain:0, damage:5,
        description:'5 de daño. Aplica Veneno 4HP, Sangrado 3HP y Quemadura 5% simultáneamente por 3T.',
        effects:[ {type:'poison', value:4, duration:3}, {type:'bleed', value:3, duration:3}, {type:'burn_pct', value:5, duration:3} ] },

      { id:'muz_m9', name:'Ejército Demoníaco', learnLevel:35,
        type:'over', target:'self', cost:9, chargeGain:0, damage:0,
        description:'Invoca a 2 Demonios Inferiores (HP:6 cada uno, atacan 2 daño por turno).',
        effects:[ {type:'summon', value:'lower_demon'}, {type:'summon', value:'lower_demon'} ] },

      { id:'muz_m10', name:'Transformación: Forma True', learnLevel:45,
        type:'over', target:'self', cost:11, chargeGain:0, damage:0,
        description:'Muzan muestra su verdadera forma. Gana Furia, Frenesí, Regeneración 20% y Escudo 8HP por 3T.',
        effects:[ {type:'buff', value:'Furia', duration:3}, {type:'buff', value:'Frenesí', duration:3}, {type:'regen', value:20, duration:3}, {type:'shield', value:8}, {type:'transform', value:'muzanTransformed'} ] },

      { id:'muz_m11', name:'Sangre Maldita', learnLevel:50,
        type:'over', target:'single', cost:10, chargeGain:0, damage:8,
        description:'8 de daño. Convierte al objetivo en Demonio (aliado) con 50% de su HP actual y 5 cargas por 2 rondas.',
        effects:[ {type:'damage', value:8}, {type:'demonize_if_survives', hp_pct:50, charges:5, duration:2} ] },

      { id:'muz_m12', name:'Absorción Vital', learnLevel:55,
        type:'over', target:'aoe', cost:11, chargeGain:0, damage:4,
        description:'4 de daño AOE. Robo de vida: Muzan recupera 2 HP por enemigo con Sangrado o Veneno golpeado.',
        effects:[ {type:'damage_aoe', value:4}, {type:'lifesteal_from_dots_aoe', value:2} ] },

      { id:'muz_m13', name:'Oscuridad Absoluta', learnLevel:60,
        type:'over', target:'aoe', cost:12, chargeGain:0, damage:5,
        description:'5 de daño AOE. Aplica Posesión 2T a todos. Los poseídos no pueden curar a sus aliados.',
        effects:[ {type:'damage_aoe', value:5}, {type:'possession_aoe', duration:2} ] },

      { id:'muz_m14', name:'Forma Demoniaca Suprema', learnLevel:70,
        type:'over', target:'self', cost:13, chargeGain:0, damage:0,
        description:'La forma más poderosa. Furia + Frenesí + Regeneración 25% + Escudo 12HP + Armadura por 4T. Muzan se cura 5 HP.',
        effects:[ {type:'buff', value:'Furia', duration:4}, {type:'buff', value:'Frenesí', duration:4}, {type:'regen', value:25, duration:4}, {type:'shield', value:12}, {type:'armor', duration:4}, {type:'heal', value:5} ] },

      { id:'muz_m15', name:'Maldición de la Luna Roja', learnLevel:80,
        type:'over', target:'aoe', cost:15, chargeGain:0, damage:7,
        description:'7 de daño AOE. Aplica Veneno 5HP, Sangrado 4HP y Quemadura Solar 3T permanentes a todos los enemigos.',
        effects:[ {type:'damage_aoe', value:7}, {type:'poison_aoe', value:5, duration:999}, {type:'bleed_aoe', value:4, duration:999}, {type:'solar_burn_aoe', value:6, duration:3} ] },

      { id:'muz_m16', name:'El Demonio Supremo', learnLevel:99,
        type:'over', target:'aoe', cost:20, chargeGain:0, damage:12,
        description:'El ataque definitivo del Rey Demonio. 12 de daño AOE. Aplica TODOS los debuffs posibles a TODOS los enemigos. Muzan se regenera completamente.',
        effects:[ {type:'damage_aoe', value:12}, {type:'all_debuffs_aoe'}, {type:'full_heal_self'} ] },
    ],

    passives: [
      { id:'muz_p1', name:'Regeneración Demoniaca', learnLevel:1,
        description:'Al inicio de cada turno, Muzan recupera 2 HP (si no tiene Quemadura Solar activa).',
        trigger:'on_turn_start',
        effects:[ {type:'regen_flat_if_no_solar_burn', value:2} ] },

      { id:'muz_p2', name:'Inmunidad Demoniaca', learnLevel:20,
        description:'Muzan es inmune a Veneno, Sangrado y Congelación.',
        trigger:'permanent',
        effects:[ {type:'immunity', value:'poison'}, {type:'immunity', value:'bleed'}, {type:'immunity', value:'freeze'} ] },

      { id:'muz_p3', name:'Rey de los Demonios', learnLevel:40,
        description:'Cuando Muzan elimina a un enemigo, todos sus aliados Demonios invocados recuperan 3 HP.',
        trigger:'on_kill',
        effects:[ {type:'heal_summons_on_kill', value:3} ] },

      { id:'muz_p4', name:'Maldición Eterna', learnLevel:60,
        description:'Cualquier enemigo que golpee a Muzan recibe Veneno 2HP 2T automáticamente.',
        trigger:'on_hit_received',
        effects:[ {type:'poison_attacker', value:2, duration:2} ] },
    ],
  },

};

// ── Convertir al formato que usa el juego ──────────────────────
// Toma los movimientos del pool actual y los convierte a char.abilities
function buildCharacterFromV2(name, charData, forTeam) {
    const poolMoves = (charData.movePool || []).map(function(moveId) {
        return (charData.moves || []).find(function(m) { return m.id === moveId; });
    }).filter(Boolean);

    const equippedPassives = (charData.passiveSlots || []).map(function(pid) {
        return (charData.passives || []).find(function(p) { return p.id === pid; });
    }).filter(Boolean);

    return {
        hp: charData.hp,
        maxHp: charData.maxHp,
        speed: charData.speed,
        charges: 0,
        shield: 0,
        shieldEffect: null,
        team: forTeam,
        isDead: false,
        statusEffects: [],
        portrait: charData.portrait || '',
        transformPortrait: charData.transformPortrait || '',
        baseName: name,
        level: charData.level || 1,
        xp: charData.xp || 0,

        // Pasiva equipada (primera activa como pasiva principal)
        passive: equippedPassives[0] ? {
            name: equippedPassives[0].name,
            description: equippedPassives[0].description,
            trigger: equippedPassives[0].trigger,
            effects: equippedPassives[0].effects || [],
            _id: equippedPassives[0].id,
        } : null,

        // Pool de movimientos activos → abilities
        abilities: poolMoves.map(function(m) {
            return {
                name: m.name,
                type: m.type,
                cost: m.cost,
                chargeGain: m.chargeGain,
                description: m.description,
                target: m.target,
                damage: m.damage,
                effects: m.effects || [],
                effect: '_engine', // usa SkillEngine
                _moveId: m.id,
            };
        }),

        // Datos completos para el sistema de progresión
        _v2data: charData,
    };
}

// ── XP SYSTEM ────────────────────────────────────────────────

const XPSystem = {
    // XP para subir del nivel N al N+1
    xpNeeded: function(level) {
        return level * 80 + 20;
    },

    // Dar XP a un personaje
    giveXP: function(charName, amount) {
        const v2 = CHARACTERS_V2[charName];
        if (!v2) return;
        v2.xp = (v2.xp || 0) + amount;
        while (v2.xp >= XPSystem.xpNeeded(v2.level || 1)) {
            v2.xp -= XPSystem.xpNeeded(v2.level);
            v2.level = (v2.level || 1) + 1;
            XPSystem.onLevelUp(charName, v2.level);
        }
    },

    // Calcular XP al final de la batalla
    calcBattleXP: function(isWinner, kills) {
        var base = isWinner ? 100 : 40;
        var killBonus = kills * (isWinner ? 10 : 5);
        return base + killBonus;
    },

    // Al subir de nivel
    onLevelUp: function(charName, newLevel) {
        var v2 = CHARACTERS_V2[charName];
        if (!v2) return;

        // Buscar movimientos que se aprenden en este nivel
        var newMoves = (v2.moves || []).filter(function(m) {
            return m.learnLevel === newLevel;
        });
        var newPassives = (v2.passives || []).filter(function(p) {
            return p.learnLevel === newLevel;
        });

        if (newMoves.length > 0 || newPassives.length > 0) {
            // Disparar evento de aprendizaje
            if (typeof window.showLearnMoveModal === 'function') {
                window.showLearnMoveModal(charName, newMoves, newPassives);
            }
        }

        addLog('⬆️ ' + charName + ' subió al nivel ' + newLevel + '!', 'buff');
    },

    // Aprender un movimiento (reemplaza un slot del pool)
    learnMove: function(charName, moveId, replaceSlotIndex) {
        var v2 = CHARACTERS_V2[charName];
        if (!v2 || replaceSlotIndex === null || replaceSlotIndex === undefined) return;
        if (!v2.movePool) v2.movePool = [];
        if (replaceSlotIndex >= 0 && replaceSlotIndex < 4) {
            v2.movePool[replaceSlotIndex] = moveId;
        }
    },

    // Equipar pasiva en un slot (0,1,2)
    equipPassive: function(charName, passiveId, slot) {
        var v2 = CHARACTERS_V2[charName];
        if (!v2) return;
        if (!v2.passiveSlots) v2.passiveSlots = [];
        v2.passiveSlots[slot] = passiveId;
    },
};

window.CHARACTERS_V2 = CHARACTERS_V2;
window.buildCharacterFromV2 = buildCharacterFromV2;
window.XPSystem = XPSystem;

console.log('[UNIVERSUS] characters-v2.js cargado — 10 personajes, 160 movimientos, 40 pasivas ✓');
