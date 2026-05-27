// ============================================================
//  UNIVERSUS: Battle Collision — SKILL ENGINE v1.0
//  Motor genérico de habilidades
//  Reemplaza el sistema manual de skills.js
//  Todo personaje usa este motor — no se necesita código custom
// ============================================================

'use strict';

const SkillEngine = (function () {

  // ── HELPERS ──────────────────────────────────────────────

  function getChar(name) { return gameState.characters[name]; }

  function getEnemyTeam(teamId) { return teamId === 'team1' ? 'team2' : 'team1'; }

  function getLiveChars(teamId) {
    return Object.keys(gameState.characters).filter(n => {
      const c = gameState.characters[n];
      return c && c.team === teamId && !c.isDead && c.hp > 0;
    });
  }

  function getLiveSummons(teamId) {
    return Object.keys(gameState.summons).filter(sid => {
      const s = gameState.summons[sid];
      return s && s.team === teamId && s.hp > 0;
    });
  }

  function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function hasBuff(charName, buffName) {
    return typeof hasStatusEffect === 'function' && hasStatusEffect(charName, buffName);
  }

  function norm(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  // ── DAMAGE RESOLVER ──────────────────────────────────────

  function resolveDamage(attackerName, baseDamage, abilityType, targetName) {
    const attacker = getChar(attackerName);
    if (!attacker || baseDamage <= 0) return baseDamage;
    let dmg = baseDamage;

    // Buff: Furia +50% daño
    if (hasBuff(attackerName, 'Furia')) dmg = Math.ceil(dmg * 1.5);

    // Buff: Frenesí — 50% crítico
    if (hasBuff(attackerName, 'Frenesi') || hasBuff(attackerName, 'Frenesí')) {
      if (Math.random() < 0.5) { dmg *= 2; addLog(`⚡ ¡FRENESÍ CRÍTICO! ${attackerName}`, 'buff'); }
    }

    // Rikudō mode doble daño
    if (attacker.rikudoMode) dmg *= 2;

    // Kurama mode +3 daño
    if (attacker.kuramaMode) dmg += 3;

    // Miedo: -50% daño
    if (gameState._miedoActive) {
      dmg = Math.max(1, Math.floor(dmg * 0.5));
      addLog(`😱 Miedo: ${attackerName} ataca con -50% de daño`, 'damage');
    }

    // Reliquias de daño
    if (attacker.equippedRelics && attacker.equippedRelics.length > 0) {
      (attacker.equippedRelics).forEach(relicName => {
        const rd = typeof RELICS_DATA !== 'undefined' ? RELICS_DATA[relicName] : null;
        if (!rd) return;
        if (rd.effect === 'basic_dmg_50pct' && abilityType === 'basic') {
          dmg = Math.ceil(dmg * 1.5);
          addLog('⚔️ Espada del Triunfo: básico +50% daño', 'buff');
        }
        if (rd.effect === 'basic_dmg_plus2' && abilityType === 'basic') {
          dmg += 2;
        }
        if (rd.effect === 'special_dmg_plus2' && (abilityType === 'special' || abilityType === 'over')) {
          dmg += 2;
        }
        if (rd.effect === 'crit_chance_bonus' && !gameState._isCritHit && Math.random() < 0.10) {
          dmg *= 2; gameState._isCritHit = true;
          addLog('💫 Cuerno del Caos: ¡Crítico!', 'buff');
        }
      });
    }

    return Math.max(1, Math.round(dmg));
  }

  // ── EFFECT EXECUTORS ─────────────────────────────────────

  const effectHandlers = {

    // ─ DAÑO ─────────────────────────────────────────────────

    damage(ctx, eff) {
      const dmg = resolveDamage(ctx.caster, eff.value, ctx.abilityType, ctx.target);
      applyDamageWithShield(ctx.target, dmg, ctx.caster);
    },

    damage_aoe(ctx, eff) {
      const dmg = resolveDamage(ctx.caster, eff.value, ctx.abilityType, null);
      const casterTeam = getChar(ctx.caster).team;
      const enemyTeam = getEnemyTeam(casterTeam);
      // Check MegaProv redirect
      if (typeof checkAndRedirectAOEMegaProv === 'function' &&
          checkAndRedirectAOEMegaProv(enemyTeam, dmg, ctx.caster)) return;
      getLiveChars(enemyTeam).forEach(n => {
        if (typeof checkAsprosAOEImmunity === 'function' && checkAsprosAOEImmunity(n, true)) {
          addLog(`🌟 ${n} es inmune al AOE`, 'buff'); return;
        }
        applyDamageWithShield(n, dmg, ctx.caster);
      });
      getLiveSummons(enemyTeam).forEach(sid => applySummonDamage(sid, dmg, ctx.caster));
    },

    damage_multi(ctx, eff) {
      // eff.value = damage per hit, eff.hits = number of hits, eff.targets = array of targets or random
      const hits = eff.hits || 2;
      const targets = ctx.targets || [ctx.target];
      targets.forEach(t => {
        if (!t) return;
        const dmg = resolveDamage(ctx.caster, eff.value, ctx.abilityType, t);
        applyDamageWithShield(t, dmg, ctx.caster);
      });
    },

    damage_ally_aoe(ctx, eff) {
      // Damage to all allies (self-sacrifice mechanics)
      const casterTeam = getChar(ctx.caster).team;
      getLiveChars(casterTeam).forEach(n => {
        if (n === ctx.caster) return;
        applyDamageWithShield(n, eff.value, ctx.caster);
      });
    },

    // ─ CURACIÓN ─────────────────────────────────────────────

    heal(ctx, eff) {
      const c = getChar(ctx.target);
      if (!c) return;
      if (typeof canHeal === 'function' && !canHeal(ctx.target)) {
        addLog(`🚫 ${ctx.target} no puede recuperar HP`, 'info'); return;
      }
      const amount = eff.percent ? Math.ceil(c.maxHp * (eff.percent / 100)) : eff.value;
      const before = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + amount);
      const healed = c.hp - before;
      if (healed > 0) addLog(`💖 ${ctx.target} recupera ${healed} HP`, 'heal');
    },

    heal_team(ctx, eff) {
      const team = getChar(ctx.caster).team;
      getLiveChars(team).forEach(n => effectHandlers.heal({ ...ctx, target: n }, eff));
    },

    heal_ally(ctx, eff) {
      effectHandlers.heal({ ...ctx, target: ctx.target }, eff);
    },

    // ─ ESCUDO ────────────────────────────────────────────────

    shield(ctx, eff) {
      const c = getChar(ctx.target);
      if (!c) return;
      c.shield = (c.shield || 0) + eff.value;
      c.shieldEffect = { name: 'Escudo', type: 'buff', duration: eff.duration || 999 };
      addLog(`🛡️ ${ctx.target} obtiene Escudo ${eff.value} HP`, 'buff');
    },

    // ─ CARGAS ────────────────────────────────────────────────

    generate_charges(ctx, eff) {
      const c = getChar(ctx.target || ctx.caster);
      if (!c) return;
      let amount = eff.value;
      if (hasBuff(ctx.target || ctx.caster, 'Concentración')) amount *= 2;
      c.charges = Math.min(20, (c.charges || 0) + amount);
      if (typeof _animCard === 'function') _animCard(ctx.target || ctx.caster, 'anim-charge', 400);
    },

    generate_charges_team(ctx, eff) {
      const team = getChar(ctx.caster).team;
      getLiveChars(team).forEach(n => {
        const c = getChar(n);
        if (!c) return;
        c.charges = Math.min(20, (c.charges || 0) + eff.value);
      });
      addLog(`⚡ Equipo aliado genera ${eff.value} cargas`, 'buff');
    },

    steal_charges(ctx, eff) {
      const target = getChar(ctx.target);
      const caster = getChar(ctx.caster);
      if (!target || !caster) return;
      const stolen = Math.min(target.charges || 0, eff.value);
      target.charges = (target.charges || 0) - stolen;
      caster.charges = Math.min(20, (caster.charges || 0) + stolen);
      if (stolen > 0) addLog(`💨 ${ctx.caster} roba ${stolen} cargas a ${ctx.target}`, 'damage');
    },

    drain_charges_aoe(ctx, eff) {
      const enemyTeam = getEnemyTeam(getChar(ctx.caster).team);
      getLiveChars(enemyTeam).forEach(n => {
        const c = getChar(n);
        if (!c) return;
        const drained = Math.min(c.charges || 0, eff.value);
        c.charges = (c.charges || 0) - drained;
        if (drained > 0) addLog(`🌀 ${n} pierde ${drained} cargas`, 'damage');
      });
    },

    // ─ BUFFS ─────────────────────────────────────────────────

    buff(ctx, eff) {
      if (typeof applyBuff === 'function') {
        applyBuff(ctx.target, { name: eff.value, type: 'buff', duration: eff.duration || 2, emoji: eff.emoji || '✨' });
        addLog(`✨ ${ctx.target} obtiene ${eff.value} (${eff.duration || 2} turno${(eff.duration||2) > 1 ? 's' : ''})`, 'buff');
      }
    },

    buff_team(ctx, eff) {
      const team = getChar(ctx.caster).team;
      getLiveChars(team).forEach(n => effectHandlers.buff({ ...ctx, target: n }, eff));
    },

    stealth(ctx, eff) {
      effectHandlers.buff(ctx, { value: 'Sigilo', duration: eff.duration || 2 });
    },

    aoe_immunity(ctx, eff) {
      effectHandlers.buff(ctx, { value: 'Esquiva Area', duration: eff.duration || 2, emoji: '🌟' });
    },

    concentration(ctx, eff) {
      effectHandlers.buff(ctx, { value: 'Concentración', duration: eff.duration || 2, emoji: '🔮' });
    },

    regen(ctx, eff) {
      if (typeof applyBuff === 'function') {
        applyBuff(ctx.target, {
          name: 'Regeneracion', type: 'buff',
          duration: eff.duration || 2,
          percent: eff.value, emoji: '💖'
        });
        addLog(`💖 ${ctx.target} obtiene Regeneración ${eff.value}% (${eff.duration || 2}T)`, 'buff');
      }
    },

    regen_team(ctx, eff) {
      const team = getChar(ctx.caster).team;
      getLiveChars(team).forEach(n => effectHandlers.regen({ ...ctx, target: n }, eff));
    },

    armor(ctx, eff) {
      if (typeof applyArmadura === 'function') applyArmadura(ctx.target, eff.duration || 2);
      else effectHandlers.buff(ctx, { value: 'Armadura', duration: eff.duration || 2, emoji: '🛡️' });
    },

    counterattack(ctx, eff) {
      effectHandlers.buff(ctx, { value: 'Contraataque', duration: eff.duration || 2, emoji: '⚔️' });
    },

    frenzy(ctx, eff) {
      effectHandlers.buff(ctx, { value: 'Frenesí', duration: eff.duration || 2, emoji: '⚡' });
    },

    frenzy_team(ctx, eff) {
      const team = getChar(ctx.caster).team;
      getLiveChars(team).forEach(n => effectHandlers.frenzy({ ...ctx, target: n }, eff));
    },

    damage_multiplier(ctx, eff) {
      const c = getChar(ctx.target);
      if (!c) return;
      c._dmgMultiplier = eff.value;
      c._dmgMultiplierTurns = eff.duration || 2;
    },

    speed_up(ctx, eff) {
      const c = getChar(ctx.target);
      if (!c) return;
      c.speed = (c.speed || 80) + eff.value;
      c._speedBonusTurns = eff.duration || 2;
      addLog(`⚡ ${ctx.target} +${eff.value} velocidad (${eff.duration || 2}T)`, 'buff');
    },

    // ─ DEBUFFS ───────────────────────────────────────────────

    stun(ctx, eff) {
      if (typeof applyDebuff === 'function') {
        applyDebuff(ctx.target, { name: 'Aturdimiento', type: 'debuff', duration: eff.duration || 1, emoji: '💫' });
        addLog(`💫 ${ctx.target} queda Aturdido (${eff.duration || 1}T)`, 'debuff');
      }
    },

    mega_stun(ctx, eff) {
      if (typeof applyDebuff === 'function') {
        applyDebuff(ctx.target, { name: 'Mega Aturdimiento', type: 'debuff', duration: eff.duration || 2, emoji: '💫' });
        addLog(`💫 ${ctx.target} queda Mega Aturdido`, 'debuff');
      }
    },

    burn(ctx, eff) {
      if (typeof applyFlatBurn === 'function') applyFlatBurn(ctx.target, eff.value, eff.duration || 2);
    },

    burn_pct(ctx, eff) {
      if (typeof applyBurn === 'function') applyBurn(ctx.target, eff.value, eff.duration || 2);
    },

    burn_aoe(ctx, eff) {
      const enemyTeam = getEnemyTeam(getChar(ctx.caster).team);
      getLiveChars(enemyTeam).forEach(n => effectHandlers.burn({ ...ctx, target: n }, eff));
    },

    solar_burn(ctx, eff) {
      if (typeof applySolarBurn === 'function') applySolarBurn(ctx.target, eff.value || 5);
    },

    poison(ctx, eff) {
      if (typeof applyPoison === 'function') applyPoison(ctx.target, eff.value, eff.duration || 2);
    },

    bleed(ctx, eff) {
      if (typeof applyDebuff === 'function') {
        applyDebuff(ctx.target, { name: 'Sangrado', type: 'debuff', duration: eff.duration || 2, flatHp: eff.value || 1, emoji: '🩸' });
        addLog(`🩸 ${ctx.target} sufre Sangrado ${eff.value}HP (${eff.duration || 2}T)`, 'debuff');
      }
    },

    freeze(ctx, eff) {
      if (typeof applyFreeze === 'function') applyFreeze(ctx.target, eff.duration || 2);
    },

    mega_freeze(ctx, eff) {
      if (typeof applyMegaFreeze === 'function') applyMegaFreeze(ctx.target, eff.duration || 2);
    },

    fear(ctx, eff) {
      if (typeof applyFear === 'function') applyFear(ctx.target, eff.duration || 2);
    },

    possession(ctx, eff) {
      if (typeof applyPossession === 'function') applyPossession(ctx.target);
    },

    confusion(ctx, eff) {
      if (typeof applyConfusion === 'function') applyConfusion(ctx.target, eff.duration || 2);
    },

    weaken(ctx, eff) {
      if (typeof applyDebuff === 'function') {
        applyDebuff(ctx.target, { name: 'Debilitado', type: 'debuff', duration: eff.duration || 2, emoji: '💔' });
        addLog(`💔 ${ctx.target} queda Debilitado`, 'debuff');
      }
    },

    silence(ctx, eff) {
      if (typeof applyDebuff === 'function') {
        applyDebuff(ctx.target, {
          name: 'Silenciar', type: 'debuff', duration: eff.duration || 2,
          silencedCategory: eff.value || 'special', emoji: '🔇'
        });
        addLog(`🔇 ${ctx.target} queda Silenciado`, 'debuff');
      }
    },

    // ─ CLEANSE ───────────────────────────────────────────────

    cleanse_self(ctx, eff) {
      const c = getChar(ctx.caster);
      if (!c) return;
      const count = eff.value || 999;
      let removed = 0;
      c.statusEffects = (c.statusEffects || []).filter(e => {
        if (!e || e.type !== 'debuff' || e.permanent) return true;
        if (removed >= count) return true;
        removed++;
        return false;
      });
      if (removed > 0) addLog(`✨ ${ctx.caster} limpia ${removed} debuff${removed > 1 ? 's' : ''}`, 'buff');
    },

    cleanse_team(ctx, eff) {
      const team = getChar(ctx.caster).team;
      getLiveChars(team).forEach(n => effectHandlers.cleanse_self({ ...ctx, caster: n }, eff));
    },

    dispel_buffs(ctx, eff) {
      const c = getChar(ctx.target);
      if (!c) return;
      const before = (c.statusEffects || []).filter(e => e && e.type === 'buff' && !e.permanent).length;
      c.statusEffects = (c.statusEffects || []).filter(e => !e || e.type !== 'buff' || e.permanent);
      if (before > 0) addLog(`🌪️ ${before} buff${before > 1 ? 's' : ''} disipado${before > 1 ? 's' : ''} de ${ctx.target}`, 'debuff');
    },

    // ─ ESPECIALES ────────────────────────────────────────────

    transform(ctx, eff) {
      const c = getChar(ctx.caster);
      if (!c) return;
      c[eff.value] = true;
      if (eff.portrait && c.transformPortrait) {
        c.portrait = c.transformPortrait;
        if (typeof audioManager !== 'undefined') audioManager.playTransformSfx();
        if (typeof renderCharacters === 'function') renderCharacters();
      }
      addLog(`✨ ${ctx.caster} se transforma`, 'buff');
    },

    summon(ctx, eff) {
      const summoner = getChar(ctx.caster);
      if (!summoner || typeof invokeSummon !== 'function') return;
      invokeSummon(eff.value, ctx.caster, summoner.team);
    },

    extra_turn(ctx, eff) {
      if (!gameState._extraTurnQueue) gameState._extraTurnQueue = [];
      gameState._extraTurnQueue.push(ctx.caster);
      addLog(`⚡ ${ctx.caster} ganará turno adicional`, 'buff');
    },

    // ─ CRÍTICOS ──────────────────────────────────────────────

    crit(ctx, eff) {
      // Solo marca la probabilidad — se aplica en el siguiente efecto de daño
      ctx._critChance = (ctx._critChance || 0) + eff.value;
    },

    // ─ CONDICIONALES ─────────────────────────────────────────

    conditional_double(ctx, eff) {
      // Double damage if condition met — handled inline in executeEffectList
      ctx._conditionalDouble = eff.condition;
    },

  };

  // ── CONDITION CHECKER ────────────────────────────────────

  function checkCondition(condition, ctx) {
    if (!condition) return true;
    const caster = getChar(ctx.caster);
    const target = ctx.target ? getChar(ctx.target) : null;

    const cond = norm(condition);
    if (cond === 'target_has_burn' || cond === 'if_target_has_burn')
      return target && (target.statusEffects || []).some(e => e && norm(e.name || '').includes('quemadura'));
    if (cond === 'target_has_debuff' || cond === 'if_target_has_debuff')
      return target && (target.statusEffects || []).some(e => e && e.type === 'debuff');
    if (cond.startsWith('if_self_hp_below:')) {
      const pct = parseFloat(cond.split(':')[1]);
      return caster && (caster.hp / caster.maxHp) * 100 <= pct;
    }
    if (cond.startsWith('if_target_has:')) {
      const effectName = cond.split(':')[1];
      return target && (target.statusEffects || []).some(e => e && norm(e.name || '') === norm(effectName));
    }
    if (cond.startsWith('if_self_has:')) {
      const effectName = cond.split(':')[1];
      return caster && (caster.statusEffects || []).some(e => e && norm(e.name || '') === norm(effectName));
    }
    return true;
  }

  // ── EFFECT LIST EXECUTOR ─────────────────────────────────

  function executeEffectList(effects, ctx) {
    if (!effects || !effects.length) return;

    // Pre-scan for crit probability
    const critEffect = effects.find(e => e.type === 'crit');
    const critChance = critEffect ? critEffect.value : 0;
    const isCrit = critChance > 0 && Math.random() < critChance;
    if (isCrit) {
      addLog(`💥 ¡CRÍTICO! ${ctx.caster}`, 'buff');
      if (gameState.battleStats) gameState.battleStats.crits++;
    }

    // Pre-scan for conditional double
    const condDouble = effects.find(e => e.type === 'conditional_double');

    effects.forEach(eff => {
      if (!eff || !eff.type) return;
      if (eff.type === 'crit' || eff.type === 'conditional_double') return; // handled above

      // Check condition guard
      if (eff.condition && !checkCondition(eff.condition, ctx)) return;

      // Double damage if crit
      const effectToRun = { ...eff };
      if (isCrit && (eff.type === 'damage' || eff.type === 'damage_aoe' || eff.type === 'damage_multi')) {
        effectToRun.value = (eff.value || 0) * 2;
      }

      // Double damage if conditional
      if (condDouble && checkCondition(condDouble, ctx) &&
          (eff.type === 'damage' || eff.type === 'damage_aoe')) {
        effectToRun.value = (effectToRun.value || 0) * 2;
        addLog(`🔥 ¡Daño doble por condición!`, 'buff');
      }

      const handler = effectHandlers[effectToRun.type];
      if (handler) {
        try { handler(ctx, effectToRun); }
        catch (err) { console.error(`[SkillEngine] Error en efecto "${effectToRun.type}":`, err); }
      } else {
        console.warn(`[SkillEngine] Efecto desconocido: "${effectToRun.type}"`);
      }
    });
  }

  // ── ABILITY EXECUTOR ─────────────────────────────────────

  function executeAbilityFromData(abilityData, casterName, targetName) {
    if (!abilityData || !abilityData.effects) {
      console.error('[SkillEngine] Habilidad sin efectos definidos:', abilityData);
      return;
    }

    const ctx = {
      caster: casterName,
      target: targetName,
      abilityType: abilityData.type,
      ability: abilityData,
    };

    executeEffectList(abilityData.effects, ctx);
  }

  // ── PASSIVE EXECUTOR ─────────────────────────────────────

  function executePassive(charName, trigger, triggerData) {
    const char = getChar(charName);
    if (!char || !char.passive || !char.passive.effects) return;

    const passive = char.passive;
    if (!passive.trigger || passive.trigger !== trigger && passive.trigger !== 'permanent') return;

    const ctx = {
      caster: charName,
      target: triggerData && triggerData.target ? triggerData.target : charName,
      abilityType: 'passive',
      triggerData,
    };

    executeEffectList(passive.effects, ctx);
  }

  // ── CHARACTER CONVERTER ──────────────────────────────────
  // Converts new JSON template format to internal gameState format

  function convertTemplateToCharacter(template, team) {
    if (!template || !template.name) {
      throw new Error('[SkillEngine] Template inválido — falta el campo "name"');
    }

    return {
      hp: template.hp || 20,
      maxHp: template.maxHp || template.hp || 20,
      speed: template.speed || 85,
      charges: 0,
      team: team || 'team1',
      statusEffects: [],
      shield: 0,
      shieldEffect: null,
      isDead: false,
      portrait: template.portrait || '',
      transformPortrait: template.transformPortrait || null,
      passive: template.passive ? {
        name: template.passive.name,
        description: template.passive.description,
        trigger: template.passive.trigger,
        effects: template.passive.effects || [],
      } : null,
      abilities: (template.abilities || []).map(ab => ({
        name: ab.name,
        type: ab.type,
        cost: ab.cost || 0,
        chargeGain: ab.chargeGain || 0,
        target: ab.target || 'single',
        description: ab.description || '',
        effects: ab.effects || [],
        // Legacy compatibility
        effect: '_engine', // signals to executeAbility to use SkillEngine
        damage: (ab.effects || []).find(e => e.type === 'damage' || e.type === 'damage_aoe')?.value || 0,
      })),
      // Meta
      _fromTemplate: true,
      baseName: template.name,
    };
  }

  // ── ABILITY REGISTER ─────────────────────────────────────
  // Allows legacy skill handlers to coexist with engine-driven characters

  const _legacyHandlers = {};

  function registerLegacyEffect(effectName, handlerFn) {
    _legacyHandlers[effectName] = handlerFn;
    console.log(`[SkillEngine] Handler legacy registrado: "${effectName}"`);
  }

  function hasLegacyHandler(effectName) {
    return effectName && effectName !== '_engine' && !!_legacyHandlers[effectName];
  }

  function runLegacyHandler(effectName, targetName, ctx) {
    if (_legacyHandlers[effectName]) {
      _legacyHandlers[effectName](targetName, ctx);
    }
  }

  // ── PUBLIC API ───────────────────────────────────────────

  return {
    executeAbility: executeAbilityFromData,
    executePassive,
    executeEffectList,
    convertTemplate: convertTemplateToCharacter,
    registerLegacy: registerLegacyEffect,
    hasLegacy: hasLegacyHandler,
    runLegacy: runLegacyHandler,
    resolveDamage,
    checkCondition,
    getChar,
    getLiveChars,
    getLiveSummons,
    getEnemyTeam,
    norm,
  };

})();

// Make globally accessible
window.SkillEngine = SkillEngine;

console.log('[UNIVERSUS] SkillEngine v1.0 cargado ✓');
