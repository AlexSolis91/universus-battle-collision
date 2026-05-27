// ============================================================
//  UNIVERSUS: Battle Collision — init-render.js v2.0
//  Inicialización y renderizado con nuevo design system
// ============================================================

// ── HELPERS ─────────────────────────────────────────────────

function normAccent(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function addLog(message, type) {
    const logEl = document.getElementById('battleLogContent');
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + (type || 'info');
    entry.textContent = message;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    if (gameState.battleLog) gameState.battleLog.push({ message, type });
}

function showContinueButton() {
    const modal = document.getElementById('turnConfirmModal');
    if (modal) modal.classList.add('show');
}

function hideContinueButton() {
    const modal = document.getElementById('turnConfirmModal');
    if (modal) modal.classList.remove('show');
}

function continueTurn() {
    hideContinueButton();
    if (typeof updateStatusEffectDurations === 'function') updateStatusEffectDurations(gameState.selectedCharacter);
    if (typeof showActionModal === 'function') showActionModal();
}

function closeActionModal() {
    const modal = document.getElementById('actionModal');
    if (modal) modal.classList.remove('show');
}

function closeTargetModal() {
    const modal = document.getElementById('targetModal');
    if (modal) modal.classList.remove('show');
}

function closeBattleStatus() {
    const modal = document.getElementById('battleStatusModal');
    if (modal) modal.style.display = 'none';
}

// ── GAME INIT ────────────────────────────────────────────────

function initGame(selectedCharacters) {
    gameState.selectedCharacter = null;
    gameState.selectedAbility = null;
    gameState.currentTurnIndex = 0;
    gameState.currentRound = 1;
    gameState.turnsInRound = 0;
    gameState.aliveCountAtRoundStart = 0;
    gameState.turnOrder = [];
    gameState.gameOver = false;
    gameState.winner = null;
    gameState._attackedThisTurn = false;
    gameState._miedoActive = false;
    gameState.summons = {};

    const logEl = document.getElementById('battleLogContent');
    if (logEl) logEl.innerHTML = '';
    gameState.battleLog = [];

    for (let k in gameState.summons) delete gameState.summons[k];

    const source = selectedCharacters || characterData;
    gameState.characters = JSON.parse(JSON.stringify(source));

    gameState.battleStats = {
        totalDamage: {}, crits: 0, summonsKilled: 0, oversUsed: 0,
        healsGiven: 0, team1Damage: 0, team2Damage: 0, killMap: {},
        critsByChar: {}, damageDone: {}, chargesGenSelf: {}, chargesGenAllies: {},
        damageReceived: {}, debuffsApplied: {}, buffsApplied: {}, summonsDone: {},
        summonKills: {}, healingDone: {}, ccApplied: {}, poisonDamage: {}, burnDamage: {},
        poisonAppliers: new Set(), burnAppliers: new Set(),
    };

    // Proxy statusEffects para pasiva Monarca de la Destruccion
    function _wrapStatusEffects(charName) {
        const ch = gameState.characters[charName];
        if (!ch || !Array.isArray(ch.statusEffects)) return;
        const _origArr = ch.statusEffects;
        const _proxied = new Proxy(_origArr, {
            get(target, prop) {
                if (prop === '__isProxied') return true;
                if (prop === 'push') {
                    return function(...items) {
                        const result = Array.prototype.push.apply(target, items);
                        items.forEach(function(item) {
                            if (item && item.type === 'buff' && !item.passiveHidden &&
                                typeof triggerMonarcaDestruccion === 'function') {
                                triggerMonarcaDestruccion(charName);
                            }
                        });
                        return result;
                    };
                }
                return target[prop];
            }
        });
        ch.statusEffects = _proxied;
    }
    for (const _cn in gameState.characters) _wrapStatusEffects(_cn);

    // Setter para mantener Proxy al filtrar statusEffects
    (function() {
        for (const _cn in gameState.characters) {
            const _ch = gameState.characters[_cn];
            if (!_ch) continue;
            let _arr = _ch.statusEffects;
            Object.defineProperty(_ch, 'statusEffects', {
                get: function() { return _arr; },
                set: function(newVal) {
                    _arr = newVal;
                    if (Array.isArray(newVal) && !newVal.__isProxied) {
                        const _pArr = newVal;
                        const _name = _cn;
                        const _proxied2 = new Proxy(_pArr, {
                            get(target2, prop2) {
                                if (prop2 === '__isProxied') return true;
                                if (prop2 === 'push') {
                                    return function(...items2) {
                                        const r = Array.prototype.push.apply(target2, items2);
                                        items2.forEach(function(item2) {
                                            if (item2 && item2.type === 'buff' && !item2.passiveHidden &&
                                                typeof triggerMonarcaDestruccion === 'function') {
                                                triggerMonarcaDestruccion(_name);
                                            }
                                        });
                                        return r;
                                    };
                                }
                                return target2[prop2];
                            }
                        });
                        _arr = _proxied2;
                    }
                },
                configurable: true, enumerable: true
            });
        }
    })();

    // Aplicar pasivas permanentes
    _applyPermanentPassives();

    // Construir orden de turnos
    buildTurnOrder();
    renderCharacters();

    // Mostrar header de turno
    _updateRoundDisplay();

    setTimeout(function() { startTurn(); }, 400);
}

function _applyPermanentPassives() {
    for (const charName in gameState.characters) {
        const ch = gameState.characters[charName];
        if (!ch || !ch.passive) continue;
        const baseName = ch.baseName || charName;

        if (baseName === 'Aldebaran') ch.statusEffects.push({ name:'Provocacion',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'🛡️' });
        if (baseName === 'Thestalos') ch.statusEffects.push({ name:'Contraataque',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'⚔️' });
        if (baseName === 'Aspros de Gemini') ch.statusEffects.push({ name:'Esquiva Area',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'✨' });
        if (baseName === 'Minato Namikaze') ch.statusEffects.push({ name:'Esquiva Area',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'⚡' });
        if (baseName === 'Flash') { ch.statusEffects.push({ name:'Esquiva Area',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'⚡' }); ch.esquivaAreaPassive = true; }
        if (baseName === 'Darth Vader') {
            ch.immuneToMiedo = true; ch.immuneToConfusion = true;
            if (!ch.statusEffects.some(e => e && (e.name||'').toLowerCase().replace(/\s/g,'') === 'auraoscura'))
                ch.statusEffects.push({ name:'Aura oscura',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'🌑' });
        }
        if (baseName === 'Gandalf') { ch.immuneToMiedo=true; ch.immuneToConfusion=true; ch.immuneToPosesion=true; }
        if (baseName === 'Rey Brujo de Angmar') {
            ch.statusEffects.push({ name:'Provocacion',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'🛡️' });
            ch.statusEffects.push({ name:'Infectar',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'🦠' });
        }
        if (baseName === 'Anakin Skywalker') ch.anakinAsistir = true;
    }
}

// ── TURN ORDER ────────────────────────────────────────────────

function buildTurnOrder() {
    const entries = [];
    for (const name in gameState.characters) {
        const ch = gameState.characters[name];
        if (ch && !ch.isDead && ch.hp > 0) entries.push({ name, speed: ch.speed || 80 });
    }
    entries.sort((a, b) => b.speed - a.speed || a.name.localeCompare(b.name));
    gameState.turnOrder = entries.map(e => e.name);
    gameState.currentTurnIndex = 0;
}

function _updateRoundDisplay() {
    const round = gameState.currentRound || 1;
    ['turnConfirmRound','roundCounter','battleStatusRound','roundDisplayHeader'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'RONDA ' + round;
    });
}

// ── PORTRAIT RESOLVER ────────────────────────────────────────

function getActivePortrait(name, char) {
    if (!char) return null;
    let _dynPortrait = char.portrait || '';

    if ((name === 'Goku' || name.startsWith('Goku')) && char.gokuForm) {
        if (char.gokuForm === 'ss1' && char.portraitSS1) _dynPortrait = char.portraitSS1;
        else if (char.gokuForm === 'ss3' && char.portraitSS3) _dynPortrait = char.portraitSS3;
        else if (char.gokuForm === 'ssblue' && char.portraitSSBlue) _dynPortrait = char.portraitSSBlue;
        else if (char.gokuForm === 'ui' && char.portraitUI) _dynPortrait = char.portraitUI;
    }
    if ((name === 'Naruto' || name.startsWith('Naruto')) && char.narutoForm) {
        if (char.narutoForm === 'sabio' && char.portraitSabio) _dynPortrait = char.portraitSabio;
        else if (char.narutoForm === 'kyubi' && char.portraitKyubi) _dynPortrait = char.portraitKyubi;
        else if (char.narutoForm === 'baryon' && char.portraitBaryon) _dynPortrait = char.portraitBaryon;
    }
    if ((name === 'Vegeta' || name.startsWith('Vegeta')) && char.vegetaForm) {
        if (char.vegetaForm === 'ssblue_evo' && char.portraitSSBlueEvo) _dynPortrait = char.portraitSSBlueEvo;
        else if (char.vegetaForm === 'ultra_ego' && char.portraitUltraEgo) _dynPortrait = char.portraitUltraEgo;
    }

    const hasTransform =
        (char.rikudoMode) ||
        (char.fenixArmorActive) ||
        (char.kuramaMode) ||
        (char.dragonFormActive) ||
        (char.ultraInstinto) ||
        (char.darkSideAwakened) ||
        (char.muzanTransformed) ||
        (char.garouSaitamaMode) ||
        (char.supermanPrimeMode) ||
        (char.varianTransformed) ||
        (char.escanorTheOneActive) ||
        ((char.daemonJineteTurns || 0) > 0) ||
        (char.antaresTransformed);

    if (hasTransform && (char.transformPortrait || char.transformationPortrait)) {
        _dynPortrait = char.transformPortrait || char.transformationPortrait;
    }
    return _dynPortrait || null;
}

// ── RENDER CHARACTERS ────────────────────────────────────────

function renderCharacters() {
    const team1Container = document.getElementById('team1Characters');
    const team2Container = document.getElementById('team2Characters');
    if (!team1Container || !team2Container) return;

    team1Container.innerHTML = '';
    team2Container.innerHTML = '';

    for (const name in gameState.characters) {
        const char = gameState.characters[name];
        if (!char) continue;

        const container = char.team === 'team1' ? team1Container : team2Container;
        const isDefeated = char.hp <= 0 || char.isDead;
        const isActive = gameState.selectedCharacter === name;
        const isTeam2 = char.team === 'team2';
        const isBoss = !!char.isBoss;
        const portrait = getActivePortrait(name, char);

        const hpPct = char.maxHp > 0 ? (char.hp / char.maxHp) * 100 : 0;
        const hpClass = hpPct > 60 ? '' : hpPct > 30 ? 'hp-medium' : hpPct > 15 ? 'hp-low' : 'hp-critical';
        const chargesPct = Math.min(100, (char.charges / 20) * 100);

        // Status effects pills
        const statusHtml = _renderStatusPills(char);

        // Relic minis
        const relicHtml = _renderRelicMinis(name, char);

        // Shield
        const shieldHtml = char.shield > 0
            ? `<span style="font-size:.65rem; color:#60a5fa; margin-left:4px; font-family:'Chakra Petch',sans-serif;">🛡️${char.shield}</span>`
            : '';

        // Transform indicator
        const transformHtml = _isTransformed(name, char)
            ? `<span style="font-size:.58rem; color:var(--plasma-gold); font-family:'Chakra Petch',sans-serif; margin-left:4px; letter-spacing:.04em;">⚡TF</span>`
            : '';

        const cardEl = document.createElement('div');
        cardEl.className = [
            'char-card',
            isDefeated ? 'dead' : '',
            isActive ? 'active' : '',
            isTeam2 ? 'team2-card' : '',
            isBoss ? 'boss-card' : '',
        ].filter(Boolean).join(' ');
        cardEl.id = 'char-' + name.replace(/\s+/g, '-');
        cardEl.dataset.charname = name;
        cardEl.title = 'Ver ficha de ' + name;
        cardEl.onclick = function() { if (typeof showCharInfo === 'function') showCharInfo(name); };

        if (isBoss) {
            cardEl.style.cssText = 'flex-direction:column; align-items:center; min-height:280px;';
        }

        cardEl.innerHTML = `
            <${portrait ? `img class="char-portrait${isDefeated ? ' defeated-img' : ''}" src="${portrait}" alt="${name}" loading="eager" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"` : 'div class="char-portrait-fallback"'}>
            ${portrait ? `<div class="char-portrait-fallback" style="display:none;">⚔️</div>` : '⚔️'}
            ${portrait ? '</img>' : '</div>'}
            
            <div class="char-info">
                <div class="char-name">
                    ${name}${transformHtml}
                </div>
                <div class="char-hp-text">
                    ❤️ ${char.hp}/${char.maxHp}${shieldHtml}
                    &nbsp;·&nbsp; ⚡ <span style="color:var(--plasma-blue);">${char.charges}/20</span>
                </div>
                <div class="hp-bar-wrap">
                    <div class="hp-bar ${hpClass}" style="width:${hpPct}%;"></div>
                </div>
                <div style="margin-top:4px; height:4px; background:rgba(0,0,0,0.3); border-radius:2px; overflow:hidden;">
                    <div style="height:100%; width:${chargesPct}%; background:linear-gradient(90deg,rgba(0,212,255,0.5),rgba(0,212,255,0.8)); border-radius:2px; transition:width 0.3s ease;"></div>
                </div>
                ${statusHtml}
                ${relicHtml}
            </div>
        `;

        // Fix portrait img tag (innerHTML doesn't support self-closing)
        if (portrait) {
            const img = document.createElement('img');
            img.className = 'char-portrait' + (isDefeated ? ' defeated-img' : '');
            img.src = portrait;
            img.alt = name;
            img.loading = 'eager';
            img.referrerPolicy = 'no-referrer';
            const ph = document.createElement('div');
            ph.className = 'char-portrait-fallback';
            ph.textContent = '⚔️';
            ph.style.display = 'none';
            img.onerror = function() { this.style.display = 'none'; ph.style.display = 'flex'; };

            cardEl.innerHTML = '';
            cardEl.appendChild(img);
            cardEl.appendChild(ph);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'char-info';
            infoDiv.innerHTML = `
                <div class="char-name">${name}${transformHtml}</div>
                <div class="char-hp-text">❤️ ${char.hp}/${char.maxHp}${shieldHtml}&nbsp;·&nbsp; ⚡ <span style="color:var(--plasma-blue);">${char.charges}/20</span></div>
                <div class="hp-bar-wrap"><div class="hp-bar ${hpClass}" style="width:${hpPct}%;"></div></div>
                <div style="margin-top:4px;height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden;">
                    <div style="height:100%;width:${chargesPct}%;background:linear-gradient(90deg,rgba(0,212,255,0.5),rgba(0,212,255,0.8));border-radius:2px;transition:width 0.3s;"></div>
                </div>
                ${statusHtml}${relicHtml}
            `;
            cardEl.appendChild(infoDiv);
        }

        container.appendChild(cardEl);
    }

    // Update action modal if open
    _updateCurrentTurnDisplay();
}

function _isTransformed(name, char) {
    return !!(char.rikudoMode || char.fenixArmorActive || char.kuramaMode ||
        char.dragonFormActive || char.ultraInstinto || char.darkSideAwakened ||
        char.muzanTransformed || char.garouSaitamaMode || char.supermanPrimeMode ||
        char.varianTransformed || char.escanorTheOneActive ||
        (char.daemonJineteTurns || 0) > 0 || char.antaresTransformed ||
        char.gokuForm || char.narutoForm || char.vegetaForm);
}

function _renderStatusPills(char) {
    if (!char.statusEffects || !char.statusEffects.length) return '';
    const pills = char.statusEffects
        .filter(e => e && !e.passiveHidden)
        .slice(0, 6)
        .map(e => {
            const isBuff = e.type === 'buff';
            const color = isBuff ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.15)';
            const textColor = isBuff ? '#93c5fd' : '#fca5a5';
            const border = isBuff ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)';
            const dur = e.permanent ? '' : (e.duration > 0 ? `(${e.duration})` : '');
            return `<span style="font-size:.6rem;padding:1px 5px;border-radius:3px;background:${color};border:1px solid ${border};color:${textColor};white-space:nowrap;">${e.emoji || (isBuff ? '✨' : '❗')} ${e.name||''}${dur}</span>`;
        }).join('');
    if (!pills) return '';
    return `<div class="char-status-effects">${pills}</div>`;
}

function _renderRelicMinis(name, char) {
    if (!char.equippedRelics || !char.equippedRelics.length) return '';
    const tierColors = { Raro:'#aaa', Especial:'#4fc3f7', Epico:'#c864ff', Legendario:'#ffd700' };
    const imgs = char.equippedRelics.slice(0, 3).map(relicName => {
        const rd = typeof RELICS_DATA !== 'undefined' ? RELICS_DATA[relicName] : null;
        if (!rd || !rd.img) return '';
        const color = tierColors[rd.tier] || '#aaa';
        return `<img src="${rd.img}" title="${relicName}" style="width:18px;height:18px;object-fit:contain;border-radius:3px;border:1px solid ${color};opacity:.85;" onerror="this.style.display='none'">`;
    }).join('');
    if (!imgs) return '';
    return `<div style="display:flex;gap:3px;margin-top:4px;">${imgs}</div>`;
}

function _updateCurrentTurnDisplay() {
    const name = gameState.selectedCharacter;
    const el = document.getElementById('currentTurnDisplay');
    if (!el) return;
    if (!name) { el.textContent = 'Calculando...'; return; }
    const char = gameState.characters[name];
    if (!char) return;
    el.textContent = '▶ ' + name;

    // Also update turn confirm modal
    const sub = document.getElementById('turnConfirmChar');
    if (sub) sub.textContent = name;
}

// ── RENDER SUMMONS ────────────────────────────────────────────

function renderSummons() {
    const t1 = document.getElementById('team1Summons');
    const t2 = document.getElementById('team2Summons');
    if (!t1 || !t2) return;
    t1.innerHTML = ''; t2.innerHTML = '';

    for (const sid in gameState.summons) {
        const s = gameState.summons[sid];
        if (!s || s.hp <= 0) continue;
        const container = s.team === 'team1' ? t1 : t2;
        const hpPct = s.maxHp > 0 ? (s.hp / s.maxHp) * 100 : 0;

        const div = document.createElement('div');
        div.className = 'summon-card';
        div.id = 'summon-' + sid;
        div.innerHTML = `
            ${s.img ? `<img class="summon-img" src="${s.img}" alt="${s.name}" onerror="this.style.display='none'">` : '<div class="summon-img" style="display:flex;align-items:center;justify-content:center;font-size:1rem;">🔮</div>'}
            <div style="flex:1;min-width:0;">
                <div class="summon-name">${s.name}</div>
                <div style="font-size:.62rem;color:var(--text-secondary);">❤️ ${s.hp}/${s.maxHp}</div>
                <div style="height:3px;background:rgba(0,0,0,0.3);border-radius:2px;margin-top:3px;overflow:hidden;">
                    <div style="height:100%;width:${hpPct}%;background:rgba(139,92,246,0.7);border-radius:2px;transition:width .3s;"></div>
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

// ── SHOW ACTION MODAL ─────────────────────────────────────────

function showActionModal() {
    const name = gameState.selectedCharacter;
    const char = gameState.characters[name];
    if (!name || !char) return;

    const modal = document.getElementById('actionModal');
    if (!modal) return;

    // Round counter
    const rc = document.getElementById('roundCounter');
    if (rc) rc.textContent = 'RONDA ' + (gameState.currentRound || 1);

    // Portrait
    const portrait = getActivePortrait(name, char);
    const imgEl = document.getElementById('actionPortraitImg');
    const fallback = document.getElementById('actionPortraitFallback');
    if (imgEl) {
        if (portrait) { imgEl.src = portrait; imgEl.style.display = ''; if (fallback) fallback.style.display = 'none'; }
        else { imgEl.style.display = 'none'; if (fallback) fallback.style.display = 'flex'; }
    }

    // Name + stats
    const titleEl = document.getElementById('actionModalTitle');
    if (titleEl) titleEl.textContent = name;

    const hpEl = document.getElementById('actionHP');
    if (hpEl) hpEl.textContent = char.hp + '/' + char.maxHp;

    const chEl = document.getElementById('actionCharges');
    if (chEl) chEl.textContent = char.charges;

    const shEl = document.getElementById('actionShield');
    const shVal = document.getElementById('actionShieldValue');
    if (shEl && shVal) {
        if (char.shield > 0) { shEl.style.display = ''; shVal.textContent = char.shield; }
        else shEl.style.display = 'none';
    }

    // Passive
    const passiveEl = document.getElementById('actionPassive');
    if (passiveEl) {
        if (char.passive) {
            passiveEl.innerHTML = `<div style="font-size:.68rem;color:#a78bfa;font-family:'Chakra Petch',sans-serif;letter-spacing:.04em;">✨ ${char.passive.name}</div>`;
        } else passiveEl.innerHTML = '';
    }

    // Status effects
    const statusEl = document.getElementById('actionStatusEffects');
    if (statusEl) statusEl.innerHTML = _renderStatusPills(char);

    // Abilities
    const abilitiesEl = document.getElementById('actionAbilities');
    if (abilitiesEl) {
        abilitiesEl.innerHTML = '';
        (char.abilities || []).forEach((ab, idx) => {
            // Calculate adjusted cost
            let cost = ab.cost;
            if (char.rikudoMode && ab.effect !== 'rikudo_mode_madara') cost = Math.ceil(cost / 2);
            if (name === 'Sauron' && char.sauronTransformed && ab.type !== 'basic') cost = Math.max(0, cost - 3);

            const canAfford = char.charges >= cost;
            const typeClass = ab.type === 'over' ? 'ability-btn-over' : ab.type === 'special' ? 'ability-btn-special' : 'ability-btn-basic';
            const typeBadge = ab.type === 'over' ? 'badge-over' : ab.type === 'special' ? 'badge-violet' : 'badge-blue';

            const btn = document.createElement('button');
            btn.className = 'ability-btn ' + typeClass;
            btn.disabled = !canAfford;
            btn.onclick = function() { selectAbility(name, idx); };

            btn.innerHTML = `
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                        <div class="ability-btn-name">${ab.name}</div>
                        <span class="badge ${typeBadge}" style="flex-shrink:0;">${ab.type.toUpperCase()}</span>
                    </div>
                    <div class="ability-btn-desc">${ab.description || ''}</div>
                </div>
                <div class="ability-btn-cost">${cost > 0 ? '💎 ' + cost : '🆓'}</div>
            `;
            abilitiesEl.appendChild(btn);
        });
    }

    modal.classList.add('show');
}

// ── OVER CINEMATIC ────────────────────────────────────────────

function _showOverCinematic(charName, abilityName, effect, team, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'over-cinematic';
    overlay.innerHTML = `
        <div class="over-cinematic-name">${charName}</div>
        <div class="over-cinematic-ability">${abilityName}</div>
    `;
    document.body.appendChild(overlay);
    setTimeout(function() {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        setTimeout(function() { overlay.remove(); if (callback) callback(); }, 450);
    }, 1200);
}

// ── CARD ANIMATION ────────────────────────────────────────────

function _animCard(charName, animClass, durationMs) {
    const el = document.getElementById('char-' + (charName || '').replace(/\s+/g, '-'));
    if (!el) return;
    el.classList.add(animClass);
    setTimeout(() => el.classList.remove(animClass), durationMs || 500);
}

// ── GAME OVER ─────────────────────────────────────────────────

function checkGameOver() {
    const alive1 = Object.keys(gameState.characters).filter(n => { const c = gameState.characters[n]; return c && c.team === 'team1' && !c.isDead && c.hp > 0; });
    const alive2 = Object.keys(gameState.characters).filter(n => { const c = gameState.characters[n]; return c && c.team === 'team2' && !c.isDead && c.hp > 0; });

    if (alive1.length === 0 || alive2.length === 0) {
        gameState.gameOver = true;
        const winner = alive1.length > 0 ? 'team1' : 'team2';
        gameState.winner = winner;

        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverText');
        if (modal && title) {
            const winnerName = winner === 'team1'
                ? (window._teamNames && window._teamNames.team1) || 'HUNTERS'
                : (window._teamNames && window._teamNames.team2) || 'REAPERS';
            title.textContent = '🏆 ' + winnerName.toUpperCase();
            title.style.color = winner === 'team1' ? 'var(--team1)' : 'var(--team2)';
            modal.classList.add('show');
        }

        // Revancha button for online
        if (gameState.gameMode === 'online') {
            const revBtn = document.getElementById('revanchaBtn');
            if (revBtn) revBtn.style.display = 'inline-flex';
        }

        audioManager.stop();
        if (typeof onGameOver === 'function') onGameOver(winner);
        return true;
    }
    return false;
}

function goToMainMenu() {
    const modal = document.getElementById('gameOverModal');
    if (modal) modal.classList.remove('show');
    ['loginScreen','lobbyScreen','waitingScreen','modeSelectScreen','charSelectScreen'].forEach(id => {
        const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    document.querySelector('.game-container').style.display = 'none';
    if (typeof showLobby === 'function') showLobby();
    else document.getElementById('lobbyScreen').style.display = 'flex';
    audioManager.stop();
    audioManager.play('audioMenu');
}

// ── SHOW CHAR INFO PANEL ──────────────────────────────────────

function showCharInfo(charName) {
    const char = gameState.characters[charName];
    if (!char) return;
    const panel = document.getElementById('charInfoPanel');
    const content = document.getElementById('charInfoContent');
    if (!panel || !content) return;

    const portrait = getActivePortrait(charName, char);
    const hpPct = char.maxHp > 0 ? (char.hp / char.maxHp) * 100 : 0;
    const hpClass = hpPct > 60 ? '' : hpPct > 30 ? 'hp-medium' : 'hp-critical';

    content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:var(--text-white);letter-spacing:.06em;">${charName}</div>
            <button onclick="document.getElementById('charInfoPanel').style.display='none'" class="btn btn-ghost btn-sm btn-icon">✕</button>
        </div>

        <div style="display:flex;gap:14px;margin-bottom:14px;">
            ${portrait ? `<img src="${portrait}" style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);border:2px solid var(--border-medium);flex-shrink:0;" onerror="this.style.display='none'">` : `<div style="width:80px;height:80px;background:var(--bg-surface);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;">⚔️</div>`}
            <div style="flex:1;">
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                    <span class="badge badge-blue">⚡ ${char.speed}</span>
                    <span class="badge ${char.team === 'team1' ? 'badge-blue' : 'badge-red'}">${(window._teamNames && window._teamNames[char.team]) || char.team}</span>
                </div>
                <div class="char-hp-text">❤️ ${char.hp}/${char.maxHp} HP${char.shield > 0 ? ` 🛡️${char.shield}` : ''}</div>
                <div class="hp-bar-wrap" style="margin-top:4px;"><div class="hp-bar ${hpClass}" style="width:${hpPct}%;"></div></div>
                <div class="char-hp-text" style="margin-top:4px;">⚡ ${char.charges}/20 cargas</div>
            </div>
        </div>

        ${char.passive ? `
        <div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:var(--radius-md);padding:10px 12px;margin-bottom:10px;">
            <div style="font-family:'Chakra Petch',sans-serif;font-size:.72rem;font-weight:700;color:#a78bfa;margin-bottom:4px;letter-spacing:.06em;">✨ PASIVA: ${char.passive.name}</div>
            <div style="font-size:.72rem;color:var(--text-secondary);line-height:1.5;">${char.passive.description}</div>
        </div>
        ` : ''}

        ${char.statusEffects && char.statusEffects.filter(e => e && !e.passiveHidden).length > 0 ? `
        <div style="margin-bottom:10px;">
            <div style="font-family:'Chakra Petch',sans-serif;font-size:.68rem;color:var(--text-muted);margin-bottom:6px;letter-spacing:.1em;text-transform:uppercase;">Efectos Activos</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${char.statusEffects.filter(e => e && !e.passiveHidden).map(e => {
                    const isBuff = e.type === 'buff';
                    const color = isBuff ? '#93c5fd' : '#fca5a5';
                    const bg = isBuff ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.1)';
                    const dur = e.permanent ? '∞' : (e.duration || 0) + 'T';
                    return `<span style="font-size:.68rem;padding:2px 8px;border-radius:4px;background:${bg};color:${color};">${e.emoji || ''} ${e.name} (${dur})</span>`;
                }).join('')}
            </div>
        </div>
        ` : ''}
    `;

    panel.style.display = 'flex';
}

// ── BUFF/DEBUFF GUIDE ─────────────────────────────────────────

function showBuffDebuffGuide() {
    const modal = document.getElementById('buffDebuffModal');
    const content = document.getElementById('buffDebuffContent');
    if (!modal || !content) return;

    const entries = [
        { name:'Furia', type:'buff', emoji:'🔥', desc:'+50% de daño en todos los ataques.' },
        { name:'Frenesí', type:'buff', emoji:'⚡', desc:'50% de probabilidad de crítico (daño doble) en cada ataque.' },
        { name:'Concentración', type:'buff', emoji:'🔮', desc:'Duplica la generación de cargas.' },
        { name:'Regeneración', type:'buff', emoji:'💖', desc:'Recupera % del HP máximo al inicio de cada turno.' },
        { name:'Escudo', type:'buff', emoji:'🛡️', desc:'Absorbe daño antes que el HP. Se reduce por daño recibido.' },
        { name:'Esquiva Área', type:'buff', emoji:'🌟', desc:'Inmune a daño AOE y efectos de área.' },
        { name:'Sigilo', type:'buff', emoji:'👻', desc:'No puede ser seleccionado por ataques ST enemigos.' },
        { name:'Provocación', type:'buff', emoji:'🛡️', desc:'Fuerza a los enemigos a atacar al portador.' },
        { name:'Contraataque', type:'buff', emoji:'⚔️', desc:'Responde automáticamente a los ataques recibidos.' },
        { name:'Armadura', type:'buff', emoji:'🛡️', desc:'Reduce el daño recibido.' },
        { name:'Aturdimiento', type:'debuff', emoji:'💫', desc:'No puede actuar en su turno.' },
        { name:'Congelación', type:'debuff', emoji:'🧊', desc:'No puede actuar. Se rompe al recibir daño.' },
        { name:'Quemadura', type:'debuff', emoji:'🔥', desc:'Pierde HP al inicio de cada turno.' },
        { name:'Quemadura Solar', type:'debuff', emoji:'☀️', desc:'Bloquea toda recuperación de HP. Daño por turno.' },
        { name:'Veneno', type:'debuff', emoji:'☠️', desc:'Pierde HP al inicio de cada turno.' },
        { name:'Posesión', type:'debuff', emoji:'👁️', desc:'Sus cargas se transfieren al rival al usar habilidades.' },
        { name:'Confusión', type:'debuff', emoji:'🌀', desc:'50% de probabilidad de atacar a un aliado aleatorio.' },
        { name:'Miedo', type:'debuff', emoji:'😱', desc:'Sus ataques hacen -50% de daño.' },
        { name:'Silenciar', type:'debuff', emoji:'🔇', desc:'No puede usar habilidades de cierto tipo.' },
        { name:'Sangrado', type:'debuff', emoji:'🩸', desc:'Pierde HP fijo al inicio de cada turno.' },
        { name:'Debilitado', type:'debuff', emoji:'💔', desc:'Reduce el daño causado.' },
    ];

    content.innerHTML = entries.map(e => {
        const isBuff = e.type === 'buff';
        const borderColor = isBuff ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.25)';
        const titleColor = isBuff ? '#93c5fd' : '#fca5a5';
        return `
            <div style="background:rgba(255,255,255,0.03);border:1px solid ${borderColor};border-radius:var(--radius-md);padding:10px 12px;">
                <div style="font-family:'Chakra Petch',sans-serif;font-size:.75rem;font-weight:700;color:${titleColor};margin-bottom:4px;">${e.emoji} ${e.name}</div>
                <div style="font-size:.7rem;color:var(--text-secondary);line-height:1.5;">${e.desc}</div>
            </div>
        `;
    }).join('');

    modal.style.display = 'block';
}

// ── APPLY DAMAGE WITH SHIELD ──────────────────────────────────

function applyDamageWithShield(targetName, damage, attackerName) {
    const target = gameState.characters[targetName];
    if (!target || target.isDead || target.hp <= 0) return 0;

    let actualDamage = damage;
    let shieldAbsorbed = 0;

    // Shield absorption
    if (target.shield > 0) {
        shieldAbsorbed = Math.min(target.shield, actualDamage);
        target.shield -= shieldAbsorbed;
        actualDamage -= shieldAbsorbed;
        if (target.shield <= 0) {
            target.shield = 0;
            target.shieldEffect = null;
        }
    }

    if (actualDamage > 0) {
        target.hp = Math.max(0, target.hp - actualDamage);
        addLog(`💥 ${targetName} recibe ${actualDamage} de daño${shieldAbsorbed > 0 ? ` (escudo absorbió ${shieldAbsorbed})` : ''}`, 'damage');

        // Battle stats
        if (gameState.battleStats && attackerName) {
            gameState.battleStats.damageDone = gameState.battleStats.damageDone || {};
            gameState.battleStats.damageDone[attackerName] = (gameState.battleStats.damageDone[attackerName] || 0) + actualDamage;
            if (target.team === 'team2') gameState.battleStats.team1Damage += actualDamage;
            else gameState.battleStats.team2Damage += actualDamage;
        }

        // Death
        if (target.hp <= 0) {
            target.hp = 0;
            target.isDead = true;
            addLog(`💀 ${targetName} ha sido eliminado`, 'damage');
            if (typeof onCharacterDeath === 'function') onCharacterDeath(targetName, attackerName);
        }

        _animCard(targetName, 'anim-damage', 400);
    } else if (shieldAbsorbed > 0) {
        addLog(`🛡️ El escudo de ${targetName} absorbe ${shieldAbsorbed} de daño`, 'buff');
    }

    if (typeof renderCharacters === 'function') renderCharacters();
    return actualDamage;
}

// ── APPLY BUFF / DEBUFF HELPERS ──────────────────────────────

function applyBuff(targetName, buffData) {
    const target = gameState.characters[targetName];
    if (!target) return;
    if (!target.statusEffects) target.statusEffects = [];
    // Remove existing non-permanent version of same buff
    target.statusEffects = target.statusEffects.filter(e =>
        !e || e.name !== buffData.name || e.permanent
    );
    target.statusEffects.push({ ...buffData });
    if (typeof renderCharacters === 'function') renderCharacters();
}

function applyDebuff(targetName, debuffData) {
    const target = gameState.characters[targetName];
    if (!target || target.isDead) return;
    if (!target.statusEffects) target.statusEffects = [];

    // Immunity checks
    if (debuffData.name === 'Miedo' && target.immuneToMiedo) {
        addLog(`🌟 ${targetName} es inmune a Miedo`, 'buff'); return;
    }
    if ((debuffData.name === 'Confusión' || debuffData.name === 'Confusion') && target.immuneToConfusion) {
        addLog(`🌟 ${targetName} es inmune a Confusión`, 'buff'); return;
    }

    target.statusEffects.push({ ...debuffData });
    if (typeof triggerIzanamiPartB === 'function') triggerIzanamiPartB(targetName);
    if (typeof renderCharacters === 'function') renderCharacters();
}

function hasStatusEffect(charName, effectName) {
    const char = gameState.characters[charName];
    if (!char || !char.statusEffects) return false;
    const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return char.statusEffects.some(e => e && norm(e.name || '') === norm(effectName));
}

function canHeal(charName) {
    const char = gameState.characters[charName];
    if (!char) return false;
    return !(char.statusEffects || []).some(e => e && normAccent(e.name || '') === 'quemadura solar');
}

// ── APPLY SUMMON DAMAGE ───────────────────────────────────────

function applySummonDamage(summonId, damage, attackerName) {
    const s = gameState.summons[summonId];
    if (!s || s.hp <= 0) return 0;
    s.hp = Math.max(0, s.hp - damage);
    addLog(`💥 ${s.name} (invocación) recibe ${damage} de daño`, 'damage');
    if (s.hp <= 0) {
        addLog(`💀 ${s.name} ha sido eliminado`, 'damage');
        if (gameState.battleStats) gameState.battleStats.summonsKilled++;
        if (typeof onSummonDeath === 'function') onSummonDeath(summonId, s, attackerName);
    }
    renderSummons();
    return damage;
}

// ── END TURN ──────────────────────────────────────────────────

function endTurn() {
    closeActionModal();
    gameState._abilityExecuting = false;
    gameState._attackedThisTurn = false;

    if (checkGameOver()) return;

    // Advance turn index
    gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;

    // Check round end
    gameState.turnsInRound++;
    const aliveCount = Object.keys(gameState.characters).filter(n => {
        const c = gameState.characters[n]; return c && !c.isDead && c.hp > 0;
    }).length;

    if (gameState.turnsInRound >= (gameState.aliveCountAtRoundStart || aliveCount)) {
        _onRoundEnd();
    } else {
        startTurn();
    }
}

function _onRoundEnd() {
    gameState.currentRound++;
    gameState.turnsInRound = 0;
    gameState.aliveCountAtRoundStart = Object.keys(gameState.characters).filter(n => {
        const c = gameState.characters[n]; return c && !c.isDead && c.hp > 0;
    }).length;

    _updateRoundDisplay();
    addLog(`🔔 ─── Ronda ${gameState.currentRound} ───`, 'info');

    if (typeof processRoundEndEffects === 'function') processRoundEndEffects();

    // Rebuild turn order for new round (respects deaths)
    buildTurnOrder();
    if (checkGameOver()) return;
    startTurn();
}

console.log('[UNIVERSUS] init-render.js v2.0 cargado ✓');
