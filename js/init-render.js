// ============================================================
//  UNIVERSUS: Battle Collision — init-render.js v3.0
//  Sistema de cartas clickeables — sin boton flotante
// ============================================================

function normAccent(str) {
    return (str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

function addLog(message, type) {
    const logEl = document.getElementById('battleLogContent');
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + (type||'info');
    entry.textContent = message;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    if (gameState.battleLog) gameState.battleLog.push({message,type});
}

// showContinueButton: reemplaza el boton flotante
// Si es turno de IA -> ejecuta automaticamente
// Si es turno del jugador -> ilumina la carta (renderCharacters lo hace)
function showContinueButton() {
    const name = gameState.selectedCharacter;
    const char = gameState.characters[name];
    if (!char) return;
    // Ocultar boton viejo si existe
    const oldBtn = document.getElementById('floatingContinueBtn');
    if (oldBtn) oldBtn.style.display = 'none';
    // IA: ejecutar automaticamente
    if (gameState.gameMode === 'solo' && char.team === gameState.aiTeam) {
        setTimeout(function() {
            if (typeof continueTurn === 'function') continueTurn();
        }, 700);
        return;
    }
    // Jugador: solo re-renderizar para iluminar la carta activa
    renderCharacters();
    _updateRoundDisplay();
}

function hideContinueButton() {
    const btn = document.getElementById('floatingContinueBtn');
    if (btn) btn.style.display = 'none';
}

function closeActionModal() {
    const modal = document.getElementById('actionModal');
    if (modal) modal.classList.remove('show');
}
function closeTargetModal() {
    const modal = document.getElementById('targetModal');
    if (modal) modal.classList.remove('show');
}

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
    gameState.characters = JSON.parse(JSON.stringify(selectedCharacters||{}));
    gameState.battleStats = {
        totalDamage:{},crits:0,summonsKilled:0,oversUsed:0,
        healsGiven:0,team1Damage:0,team2Damage:0,killMap:{},
        damageDone:{},poisonAppliers:new Set(),burnAppliers:new Set(),
    };
    _applyPermanentPassives();
    buildTurnOrder();
    renderCharacters();
    _updateRoundDisplay();
    setTimeout(function(){startTurn();},500);
}

function _applyPermanentPassives() {
    for (const cn in gameState.characters) {
        const ch = gameState.characters[cn];
        if (!ch||!ch.passive) continue;
        const bn = ch.baseName||cn;
        if (bn==='Darth Vader') {
            ch.immuneToMiedo=true; ch.immuneToConfusion=true;
            ch.statusEffects=ch.statusEffects||[];
            if (!ch.statusEffects.some(function(e){return e&&normAccent(e.name||'')==='aura oscura';}))
                ch.statusEffects.push({name:'Aura oscura',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'🌑'});
        }
        if (bn==='Superman') {
            ch.statusEffects=ch.statusEffects||[];
            if (!ch.statusEffects.some(function(e){return e&&normAccent(e.name||'')==='provocacion';}))
                ch.statusEffects.push({name:'Provocacion',type:'buff',duration:999,permanent:true,passiveHidden:true,emoji:'⚠️'});
        }
        if (bn==='Gandalf') { ch.immuneToMiedo=true; ch.immuneToConfusion=true; ch.immuneToPosesion=true; }
    }
}

function buildTurnOrder() {
    const entries=[];
    for (const name in gameState.characters) {
        const ch=gameState.characters[name];
        if (ch&&!ch.isDead&&ch.hp>0) entries.push({name:name,speed:ch.speed||80});
    }
    entries.sort(function(a,b){return b.speed-a.speed||a.name.localeCompare(b.name);});
    gameState.turnOrder=entries.map(function(e){return e.name;});
    gameState.currentTurnIndex=0;
    gameState.aliveCountAtRoundStart=entries.length;
}

function _updateRoundDisplay() {
    const r=gameState.currentRound||1;
    ['roundCounter','roundDisplayHeader','battleStatusRound'].forEach(function(id){
        const el=document.getElementById(id);
        if (el) el.textContent='RONDA '+r;
    });
}

function getActivePortrait(name,char) {
    if (!char) return null;
    let p=char.portrait||'';
    if ((char.rikudoMode||char.fenixArmorActive||char.kuramaMode||char.dragonFormActive||
         char.ultraInstinto||char.darkSideAwakened||char.muzanTransformed||char.garouSaitamaMode||
         char.supermanPrimeMode||char.varianTransformed||char.escanorTheOneActive||char.antaresTransformed||
         char.gokuForm||char.narutoForm||char.vegetaForm) &&
        (char.transformPortrait||char.transformationPortrait)) {
        p=char.transformPortrait||char.transformationPortrait;
    }
    return p||null;
}

// ── RENDER CHARACTERS AS CARDS ──────────────────────────────

function renderCharacters() {
    const c1=document.getElementById('team1Characters');
    const c2=document.getElementById('team2Characters');
    if (!c1||!c2) return;
    c1.innerHTML=''; c2.innerHTML='';

    for (const name in gameState.characters) {
        const char=gameState.characters[name];
        if (!char) continue;
        const container=char.team==='team1'?c1:c2;
        const isDead=char.hp<=0||char.isDead;
        const isActive=gameState.selectedCharacter===name;
        const isPlayer=char.team!==gameState.aiTeam;
        const isClickable=isActive&&isPlayer&&!isDead;
        const portrait=getActivePortrait(name,char);

        const hpPct=char.maxHp>0?Math.max(0,(char.hp/char.maxHp)*100):0;
        const chgPct=Math.min(100,((char.charges||0)/20)*100);
        const v2=typeof CHARACTERS_V2!=='undefined'?CHARACTERS_V2[char.baseName||name]:null;
        const charLevel=v2?v2.level:1;
        const xpPct=v2&&typeof XPSystem!=='undefined'?Math.min(100,(v2.xp/XPSystem.xpNeeded(v2.level))*100):0;

        const card=document.createElement('div');
        card.id='char-'+name.replace(/\s+/g,'-');
        card.dataset.charname=name;

        const glowColor=char.team==='team1'?'#00d4ff':'#ff6644';

        // Use new card classes from index.html CSS
        let cardClass='char-card-v3';
        if (isDead) cardClass+=' dead';
        else if (isActive && isPlayer) cardClass+=' active-player';
        else if (isActive && !isPlayer) cardClass+=' active-ai';
        card.className=cardClass;

        // Portrait area (top 72% of card)
        const imgArea=document.createElement('div');
        imgArea.className='card-portrait-wrap';
        imgArea.style.cssText='position:relative;';

        if (portrait) {
            const img=document.createElement('img');
            img.src=portrait; img.alt=name; img.loading='eager'; img.referrerPolicy='no-referrer';
            img.className='card-portrait';
            img.style.cssText='';
            img.onerror=function(){this.style.display='none';};
            imgArea.appendChild(img);
        } else {
            const ph=document.createElement('div');
            ph.className='card-portrait-placeholder';
            ph.style.cssText='';
            ph.textContent='⚔️';
            imgArea.appendChild(ph);
        }

        // Gradient overlay for readability
        const grad=document.createElement('div');
        grad.style.cssText='position:absolute;bottom:0;left:0;right:0;height:45%;background:linear-gradient(0deg,rgba(4,6,15,0.98) 0%,rgba(4,6,15,0.6) 60%,transparent 100%);pointer-events:none;';
        imgArea.appendChild(grad);

        // Level badge - top right

        // Active turn indicator - top left
        if (isActive&&!isDead) {
            const ind=document.createElement('div');
            ind.className='card-turn-badge '+(isPlayer?'player':'ai');
            ind.textContent=isPlayer?'▶ TURNO':'🤖 IA';
            imgArea.appendChild(ind);
        }

        // Name at bottom of image
        const nameEl=document.createElement('div');
        nameEl.style.cssText='position:absolute;bottom:0;left:0;right:0;text-align:center;font-family:Bebas Neue,sans-serif;font-size:.85rem;letter-spacing:.08em;color:#fff;text-shadow:0 0 12px rgba(0,0,0,1),0 1px 4px rgba(0,0,0,1);z-index:5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:4px 6px 6px;background:linear-gradient(0deg,rgba(4,6,15,0.95) 60%,transparent 100%);';
        nameEl.textContent='▶ ' + name + ' ◀';
        imgArea.appendChild(nameEl);

        card.appendChild(imgArea);

        // Stats panel (bottom section)
        const stats=document.createElement('div');
        stats.style.cssText='padding:6px 7px;background:#080d1a;';

        // HP row
        const hpRow=document.createElement('div');
        hpRow.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;';
        hpRow.innerHTML='<span style="font-family:Chakra Petch,sans-serif;font-size:.55rem;color:#aaa;">HP</span>' +
            '<span style="font-family:Chakra Petch,sans-serif;font-size:.55rem;color:#e8edf5;">'+char.hp+'/'+char.maxHp+'</span>';
        stats.appendChild(hpRow);

        const hpWrap=document.createElement('div');
        hpWrap.style.cssText='height:5px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;margin-bottom:4px;';
        const hpBarEl=document.createElement('div');
        const hpColor=hpPct>60?'#10b981':hpPct>30?'#f59e0b':'#ef4444';
        hpBarEl.style.cssText='height:100%;width:'+hpPct+'%;background:'+hpColor+';border-radius:3px;transition:width .4s;';
        hpWrap.appendChild(hpBarEl); stats.appendChild(hpWrap);

        // Charges row
        const chgRow=document.createElement('div');
        chgRow.style.cssText='display:flex;align-items:center;gap:3px;margin-bottom:2px;';
        chgRow.innerHTML='<span style="font-size:.55rem;">⚡</span><span style="font-family:Chakra Petch,sans-serif;font-size:.55rem;color:#f59e0b;">'+( char.charges||0)+'/20</span>';
        stats.appendChild(chgRow);

        const chgWrap=document.createElement('div');
        chgWrap.style.cssText='height:4px;background:rgba(0,0,0,0.4);border-radius:2px;overflow:hidden;margin-bottom:4px;';
        const chgBarEl=document.createElement('div');
        chgBarEl.style.cssText='height:100%;width:'+chgPct+'%;background:#f59e0b;border-radius:2px;transition:width .4s;';
        chgWrap.appendChild(chgBarEl); stats.appendChild(chgWrap);

        // XP bar
        if (v2) {
            const xpRow=document.createElement('div');
            xpRow.style.cssText='display:flex;align-items:center;gap:3px;margin-bottom:2px;';
            xpRow.innerHTML='<span style="font-family:Chakra Petch,sans-serif;font-size:.5rem;color:#4fc3f7;">XP</span>';
            stats.appendChild(xpRow);
            const xpWrap=document.createElement('div');
            xpWrap.style.cssText='height:3px;background:rgba(0,0,0,0.4);border-radius:2px;overflow:hidden;margin-bottom:4px;';
            const xpBarEl=document.createElement('div');
            xpBarEl.style.cssText='height:100%;width:'+xpPct+'%;background:#4fc3f7;border-radius:2px;';
            xpWrap.appendChild(xpBarEl); stats.appendChild(xpWrap);
        }

        // Status pills
        const activePills=(char.statusEffects||[]).filter(function(e){return e&&!e.passiveHidden;}).slice(0,3);
        if (activePills.length>0) {
            const pillsDiv=document.createElement('div');
            pillsDiv.style.cssText='display:flex;flex-wrap:wrap;gap:2px;';
            activePills.forEach(function(e){
                const isBuff=e.type==='buff';
                const bg=isBuff?'rgba(16,185,129,0.22)':'rgba(239,68,68,0.22)';
                const col=isBuff?'#6ee7b7':'#fca5a5';
                const dur=e.permanent?'':(e.duration>0?' '+e.duration:'');
                const span=document.createElement('span');
                span.className='card-pill '+(e.type==='buff'?'pill-buff':'pill-debuff');
                span.style.cssText='';
                span.textContent=(e.emoji||'')+' '+(e.name||'')+dur;
                pillsDiv.appendChild(span);
            });
            stats.appendChild(pillsDiv);
        }

        card.appendChild(stats);

        // Hover: mostrar info en panel izquierdo
        card.onmouseenter = (function(n, c) {
            return function() { showCardInfo(n, c); };
        })(name, char);
        card.onmouseleave = function() { hideCardInfo(); };

        // Click: solo si es la carta activa del jugador
        if (isClickable) {
            card.onclick = function() {
                if (typeof continueTurn === 'function') continueTurn();
            };
        }

        container.appendChild(card);
    }

    _updateCurrentTurnDisplay();
}

function _updateCurrentTurnDisplay() {
    const name=gameState.selectedCharacter;
    const el=document.getElementById('currentTurnDisplay');
    if (!el) return;
    if (!name) { el.textContent='Calculando...'; el.style.color='#445577'; return; }
    const char=gameState.characters[name];
    const isAI=char&&char.team===gameState.aiTeam;
    el.textContent=(isAI?'🤖 ':' ▶ ')+name;
    el.style.color=isAI?'#ff6644':'#00d4ff';
}

function renderSummons() {
    const t1=document.getElementById('team1Summons');
    const t2=document.getElementById('team2Summons');
    if (!t1||!t2) return;
    t1.innerHTML=''; t2.innerHTML='';
    for (const sid in gameState.summons) {
        const s=gameState.summons[sid];
        if (!s||s.hp<=0) continue;
        const container=s.team==='team1'?t1:t2;
        const hpPct=s.maxHp>0?(s.hp/s.maxHp)*100:0;
        const div=document.createElement('div');
        div.className='summon-card'; div.id='summon-'+sid;
        div.innerHTML='<span style="font-size:1.1rem;">🔮</span><div style="flex:1;min-width:0;">' +
            '<div class="summon-name">'+s.name+'</div>' +
            '<div style="font-size:.58rem;color:#8899bb;">❤️ '+s.hp+'/'+s.maxHp+'</div>' +
            '<div style="height:3px;background:rgba(0,0,0,0.3);border-radius:2px;margin-top:2px;overflow:hidden;">' +
            '<div style="height:100%;width:'+hpPct+'%;background:rgba(139,92,246,0.7);border-radius:2px;"></div></div></div>';
        container.appendChild(div);
    }
}

// showActionModal — ahora usa showMoveModal (diseño de carta)
function showActionModal() {
    showMoveModal();
}

function showMoveModal() {
    const name = gameState.selectedCharacter;
    const char = gameState.characters[name];
    if (!name || !char) return;

    const modal = document.getElementById('moveModal');
    if (!modal) return;

    const portrait = getActivePortrait(name, char);
    const v2 = typeof CHARACTERS_V2 !== 'undefined' ? CHARACTERS_V2[char.baseName || name] : null;
    const charLevel = v2 ? v2.level : 1;

    // Portrait
    const imgEl = document.getElementById('moveModalPortrait');
    const imgFb = document.getElementById('moveModalPortraitFb');
    if (imgEl) {
        if (portrait) { imgEl.src = portrait; imgEl.style.display = 'block'; if (imgFb) imgFb.style.display = 'none'; }
        else { imgEl.style.display = 'none'; if (imgFb) imgFb.style.display = 'flex'; }
    }

    // Name + level
    const nameEl = document.getElementById('moveModalName');
    if (nameEl) {
        nameEl.innerHTML = name + '<span style="font-size:.7rem;color:#ffd700;margin-left:8px;font-family:Chakra Petch,sans-serif;">Nv ' + charLevel + '</span>';
    }

    // Team badge
    const teamEl = document.getElementById('moveModalTeam');
    if (teamEl) {
        const isTeam1 = char.team === 'team1';
        teamEl.textContent = isTeam1 ? '🔷 HUNTERS' : '🔶 REAPERS';
        teamEl.style.color = isTeam1 ? '#00d4ff' : '#ff6644';
    }

    // Stats
    const hpBar = document.getElementById('moveModalHpBar');
    const hpText = document.getElementById('moveModalHpText');
    const velText = document.getElementById('moveModalVel');
    const chgText = document.getElementById('moveModalCharges');
    const hpPct = char.maxHp > 0 ? Math.max(0, (char.hp / char.maxHp) * 100) : 0;
    if (hpBar) { hpBar.style.width = hpPct + '%'; hpBar.style.background = hpPct > 60 ? '#10b981' : hpPct > 30 ? '#f59e0b' : '#ef4444'; }
    if (hpText) hpText.textContent = 'HP: ' + char.hp + ' / ' + char.maxHp;
    if (velText) velText.textContent = 'Velocidad: ' + (char.speed || '?');
    if (chgText) chgText.textContent = 'Cargas: ' + (char.charges || 0) + '/20';

    // Shield
    const shieldEl = document.getElementById('moveModalShield');
    if (shieldEl) shieldEl.textContent = char.shield > 0 ? '🛡️ Escudo: ' + char.shield + ' HP' : '';

    // Passive
    const passiveEl = document.getElementById('moveModalPassive');
    if (passiveEl && char.passive) {
        passiveEl.style.display = 'block';
        passiveEl.querySelector('.passive-name').textContent = '✨ PASIVA: ' + char.passive.name;
        passiveEl.querySelector('.passive-desc').textContent = char.passive.description || '';
    } else if (passiveEl) { passiveEl.style.display = 'none'; }

    // Relics
    const relicsEl = document.getElementById('moveModalRelics');
    if (relicsEl) {
        if (char.equippedRelics && char.equippedRelics.length > 0 && typeof RELICS_DATA !== 'undefined') {
            const relicHTML = char.equippedRelics.map(function(r) {
                const rd = RELICS_DATA[r];
                if (!rd) return '';
                const tierColor = {Raro:'#aaa',Especial:'#4fc3f7',Epico:'#c864ff',Legendario:'#ffd700'}[rd.tier] || '#aaa';
                return '<div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid ' + tierColor + '33;border-radius:6px;padding:5px 8px;flex:1;">' +
                    '<img src="' + rd.img + '" style="width:24px;height:24px;object-fit:contain;">' +
                    '<span style="font-size:.6rem;color:' + tierColor + ';">' + r + '</span>' +
                    '</div>';
            }).join('');
            relicsEl.style.display = 'block';
            relicsEl.querySelector('.relics-list').innerHTML = relicHTML;
        } else {
            relicsEl.style.display = 'none';
        }
    }

    // Moves grid (2 columns)
    const movesEl = document.getElementById('moveModalMoves');
    if (movesEl) {
        movesEl.innerHTML = '';
        (char.abilities || []).forEach(function(ab, idx) {
            let cost = ab.cost || 0;
            if (char.rikudoMode) cost = Math.ceil(cost / 2);
            const canAfford = (char.charges || 0) >= cost;
            const typeColors = { basic:'#00d4ff', special:'#a78bfa', over:'#f59e0b' };
            const typeColor = typeColors[ab.type] || '#aaa';
            const typeName = { basic:'BASIC', special:'SPECIAL', over:'OVER' }[ab.type] || ab.type.toUpperCase();

            const card = document.createElement('div');
            card.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';opacity:' + (canAfford ? '1' : '0.4') + ';transition:all .15s;';
            if (canAfford) {
                card.onmouseover = function() { this.style.borderColor = typeColor; this.style.background = 'rgba(255,255,255,0.08)'; };
                card.onmouseout = function() { this.style.borderColor = 'rgba(255,255,255,0.1)'; this.style.background = 'rgba(255,255,255,0.04)'; };
            }
            card.innerHTML =
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">' +
                '<div style="font-family:Chakra Petch,sans-serif;font-size:.78rem;font-weight:700;color:#e8edf5;">' + (ab.name || '') + '</div>' +
                '<span style="font-family:Chakra Petch,sans-serif;font-size:.55rem;font-weight:700;color:' + typeColor + ';border:1px solid ' + typeColor + '44;border-radius:4px;padding:1px 5px;">' + typeName + '</span>' +
                '</div>' +
                '<div style="font-size:.68rem;color:#8899bb;line-height:1.5;margin-bottom:8px;">' + (ab.description || '') + '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                '<div style="font-family:Chakra Petch,sans-serif;font-size:.65rem;color:' + (cost > 0 ? '#00d4ff' : '#10b981') + ';background:rgba(0,0,0,0.3);border-radius:4px;padding:2px 7px;">💎 ' + cost + ' cargas</div>' +
                '</div>';

            if (canAfford) {
                (function(i) { card.onclick = function() { closeMoveModal(); selectAbility(name, i); }; })(idx);
            }
            movesEl.appendChild(card);
        });
    }

    modal.classList.add('show');
}

function closeMoveModal() {
    const modal = document.getElementById('moveModal');
    if (modal) modal.classList.remove('show');
}

// Legacy — redirect to showMoveModal
function closeActionModal() {
    closeMoveModal();
    const old = document.getElementById('actionModal');
    if (old) old.classList.remove('show');
}

function _animCard(charName,animClass,durationMs) {
    const el=document.getElementById('char-'+(charName||'').replace(/\s+/g,'-'));
    if (!el) return;
    el.classList.add(animClass);
    setTimeout(function(){el.classList.remove(animClass);},durationMs||500);
}

function checkGameOver() {
    const a1=Object.keys(gameState.characters).filter(function(n){const c=gameState.characters[n];return c&&c.team==='team1'&&!c.isDead&&c.hp>0;});
    const a2=Object.keys(gameState.characters).filter(function(n){const c=gameState.characters[n];return c&&c.team==='team2'&&!c.isDead&&c.hp>0;});
    if (a1.length===0||a2.length===0) {
        if (!gameState.gameOver){gameState.gameOver=true;gameState.winner=a1.length>0?'team1':'team2';if(typeof onGameOver==='function')onGameOver(gameState.winner);}
        return true;
    }
    return false;
}

function applyDamageWithShield(targetName,damage,attackerName) {
    const target=gameState.characters[targetName];
    if (!target||target.isDead||target.hp<=0) return 0;
    let actualDamage=damage; let shieldAbsorbed=0;
    if (target.shield>0){shieldAbsorbed=Math.min(target.shield,actualDamage);target.shield-=shieldAbsorbed;actualDamage-=shieldAbsorbed;if(target.shield<=0){target.shield=0;target.shieldEffect=null;}}
    if (actualDamage>0) {
        target.hp=Math.max(0,target.hp-actualDamage);
        addLog('💥 '+targetName+' recibe '+actualDamage+' de daño'+(shieldAbsorbed>0?' (🛡️'+shieldAbsorbed+' absorbido)':''),'damage');
        if (gameState.battleStats&&attackerName){gameState.battleStats.damageDone=gameState.battleStats.damageDone||{};gameState.battleStats.damageDone[attackerName]=(gameState.battleStats.damageDone[attackerName]||0)+actualDamage;if(target.team==='team2')gameState.battleStats.team1Damage+=actualDamage;else gameState.battleStats.team2Damage+=actualDamage;}
        if (target.hp<=0){target.hp=0;target.isDead=true;addLog('💀 '+targetName+' eliminado','damage');if(typeof onCharacterDeath==='function')onCharacterDeath(targetName,attackerName);}
        _animCard(targetName,'anim-damage',400);
    } else if (shieldAbsorbed>0) { addLog('🛡️ '+targetName+': escudo absorbe '+shieldAbsorbed,'buff'); }
    if (typeof renderCharacters==='function') renderCharacters();
    return actualDamage;
}

function applyBuff(targetName,buffData) {
    const target=gameState.characters[targetName];if(!target)return;
    if(!target.statusEffects)target.statusEffects=[];
    target.statusEffects=target.statusEffects.filter(function(e){return!e||e.name!==buffData.name||e.permanent;});
    target.statusEffects.push(Object.assign({},buffData));
    if(typeof renderCharacters==='function')renderCharacters();
}
function applyDebuff(targetName,debuffData) {
    const target=gameState.characters[targetName];if(!target||target.isDead)return;
    if(!target.statusEffects)target.statusEffects=[];
    if(debuffData.name==='Miedo'&&target.immuneToMiedo){addLog('🌟 '+targetName+' inmune a Miedo','buff');return;}
    if((debuffData.name==='Confusión'||debuffData.name==='Confusion')&&target.immuneToConfusion){addLog('🌟 '+targetName+' inmune a Confusión','buff');return;}
    target.statusEffects.push(Object.assign({},debuffData));
    if(typeof triggerIzanamiPartB==='function')triggerIzanamiPartB(targetName);
    if(typeof renderCharacters==='function')renderCharacters();
}
function hasStatusEffect(charName,effectName) {
    const char=gameState.characters[charName];if(!char||!char.statusEffects)return false;
    return char.statusEffects.some(function(e){return e&&normAccent(e.name||'')===normAccent(effectName);});
}
function canHeal(charName) {
    const char=gameState.characters[charName];if(!char)return false;
    return!(char.statusEffects||[]).some(function(e){return e&&normAccent(e.name||'')==='quemadura solar';});
}
function applySummonDamage(summonId,damage,attackerName) {
    const s=gameState.summons[summonId];if(!s||s.hp<=0)return 0;
    s.hp=Math.max(0,s.hp-damage);
    addLog('💥 '+s.name+' -'+damage+' HP','damage');
    if(s.hp<=0){addLog('💀 '+s.name+' eliminado','damage');if(gameState.battleStats)gameState.battleStats.summonsKilled++;if(typeof onSummonDeath==='function')onSummonDeath(summonId,s,attackerName);}
    renderSummons(); return damage;
}

function updateCurrentTurnDisplay(){_updateCurrentTurnDisplay();}
function highlightActiveCharacter(){}
function renderTurnOrder(){}
function showBuffDebuffGuide(){}
function showCharInfo(){}

// ── CARD HOVER INFO PANEL ────────────────────────────────────

function showCardInfo(name, char) {
    const panel = document.getElementById('cardInfoContent');
    if (!panel) return;

    const portrait = getActivePortrait(name, char);
    const hpPct = char.maxHp > 0 ? Math.max(0, (char.hp / char.maxHp) * 100) : 0;
    const hpColor = hpPct > 60 ? '#10b981' : hpPct > 30 ? '#f59e0b' : '#ef4444';
    const chgPct = Math.min(100, ((char.charges || 0) / 20) * 100);
    const v2 = typeof CHARACTERS_V2 !== 'undefined' ? CHARACTERS_V2[char.baseName || name] : null;

    let html = '';

    // Portrait
    if (portrait) {
        html += '<img src="' + portrait + '" class="card-info-portrait" referrerpolicy="no-referrer">';
    } else {
        html += '<div style="width:100%;height:120px;background:linear-gradient(180deg,#0d1428,#030508);display:flex;align-items:center;justify-content:center;font-size:3rem;">⚔️</div>';
    }

    html += '<div style="padding:10px 12px;">';

    // Name
    html += '<div style="font-family:Bebas Neue,sans-serif;font-size:1.2rem;color:#fff;letter-spacing:.06em;line-height:1;margin-bottom:6px;">' + name + '</div>';

    // Stats
    html += '<div class="ci-stat-row"><span class="ci-stat-label">HP</span><span class="ci-stat-val">' + char.hp + '/' + char.maxHp + (char.shield > 0 ? ' 🛡️' + char.shield : '') + '</span></div>';
    html += '<div class="ci-bar-wrap"><div class="ci-bar-fill" style="width:' + hpPct + '%;background:' + hpColor + ';"></div></div>';
    html += '<div class="ci-stat-row"><span class="ci-stat-label">Velocidad</span><span class="ci-stat-val">⚡ ' + (char.speed || '?') + '</span></div>';
    html += '<div class="ci-stat-row"><span class="ci-stat-label">Cargas</span><span class="ci-stat-val">💎 ' + (char.charges || 0) + '/20</span></div>';
    html += '<div class="ci-bar-wrap"><div class="ci-bar-fill" style="width:' + chgPct + '%;background:#f59e0b;"></div></div>';
    if (v2) {
        const xpNeeded = typeof XPSystem !== 'undefined' ? XPSystem.xpNeeded(v2.level) : 100;
        const xpPct = Math.min(100, (v2.xp / xpNeeded) * 100);
        html += '<div class="ci-stat-row"><span class="ci-stat-label">Nivel</span><span class="ci-stat-val" style="color:#ffd700;">Nv ' + v2.level + '</span></div>';
        html += '<div class="ci-bar-wrap"><div class="ci-bar-fill" style="width:' + xpPct + '%;background:#4fc3f7;"></div></div>';
    }

    // Status effects
    const activeEffects = (char.statusEffects || []).filter(function(e) { return e && !e.passiveHidden; });
    if (activeEffects.length > 0) {
        html += '<div class="ci-section">Efectos Activos</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;">';
        activeEffects.forEach(function(e) {
            const isBuff = e.type === 'buff';
            const bg = isBuff ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)';
            const col = isBuff ? '#6ee7b7' : '#fca5a5';
            const dur = e.permanent ? '' : (e.duration > 0 ? ' ' + e.duration + 'T' : '');
            html += '<span style="font-size:.55rem;padding:1px 5px;border-radius:3px;background:' + bg + ';color:' + col + ';white-space:nowrap;">' + (e.emoji || '') + ' ' + (e.name || '') + dur + '</span>';
        });
        html += '</div>';
    }

    // Passive
    if (char.passive) {
        html += '<div class="ci-section">Pasiva</div>';
        html += '<div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.18);border-radius:6px;padding:6px 8px;margin-bottom:4px;">';
        html += '<div style="font-family:Chakra Petch,sans-serif;font-size:.62rem;font-weight:700;color:#a78bfa;margin-bottom:3px;">✨ ' + char.passive.name + '</div>';
        html += '<div style="font-size:.6rem;color:#8899bb;line-height:1.45;">' + (char.passive.description || '') + '</div>';
        html += '</div>';
    }

    // Moves
    if (char.abilities && char.abilities.length > 0) {
        html += '<div class="ci-section">Movimientos</div>';
        char.abilities.forEach(function(ab) {
            const typeColors = { basic:'#00d4ff', special:'#a78bfa', over:'#f59e0b' };
            const typeColor = typeColors[ab.type] || '#aaa';
            html += '<div class="ci-move-row">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
            html += '<div class="ci-move-name">' + (ab.name || '') + '</div>';
            html += '<span style="font-size:.5rem;color:' + typeColor + ';border:1px solid ' + typeColor + '44;border-radius:3px;padding:1px 4px;font-family:Chakra Petch,sans-serif;">' + (ab.type || '').toUpperCase() + '</span>';
            html += '</div>';
            html += '<div class="ci-move-desc">' + (ab.description || '') + '</div>';
            html += '<div class="ci-move-meta">💎 ' + (ab.cost || 0) + ' cargas</div>';
            html += '</div>';
        });
    }

    html += '</div>';
    panel.innerHTML = html;
}

function hideCardInfo() {
    const panel = document.getElementById('cardInfoContent');
    if (!panel) return;
    panel.innerHTML = '<div style="padding:20px;text-align:center;color:#223;font-family:Chakra Petch,sans-serif;font-size:.7rem;letter-spacing:.1em;">Pasa el cursor sobre<br>una carta para ver<br>su información</div>';
}

console.log('[UNIVERSUS] init-render.js v3.0 — cartas clickeables ✓');
