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
        const lvlBadge=document.createElement('div');
        lvlBadge.style.cssText='position:absolute;top:6px;right:7px;font-family:Chakra Petch,sans-serif;font-size:.85rem;font-weight:700;color:#ffd700;text-shadow:0 0 8px rgba(255,215,0,0.9),0 1px 3px rgba(0,0,0,1);z-index:5;line-height:1;';
        lvlBadge.textContent=charLevel;
        imgArea.appendChild(lvlBadge);

        // Active turn indicator - top left
        if (isActive&&!isDead) {
            const ind=document.createElement('div');
            ind.className='card-turn-badge '+(isPlayer?'player':'ai');
            ind.textContent=isPlayer?'▶ TURNO':'🤖 IA';
            imgArea.appendChild(ind);
        }

        // Name at bottom of image
        const nameEl=document.createElement('div');
        nameEl.style.cssText='position:absolute;bottom:6px;left:6px;right:6px;font-family:Chakra Petch,sans-serif;font-size:.62rem;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,1);z-index:5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        nameEl.textContent=name;
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

        // Click: solo si es la carta activa del jugador
        if (isClickable) {
            card.onclick=function(){
                if (typeof continueTurn==='function') continueTurn();
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

function showActionModal() {
    const name=gameState.selectedCharacter;
    const char=gameState.characters[name];
    if (!name||!char) return;
    const modal=document.getElementById('actionModal');
    if (!modal) return;

    const rc=document.getElementById('roundCounter');
    if (rc) rc.textContent='RONDA '+(gameState.currentRound||1);

    const portrait=getActivePortrait(name,char);
    const imgEl=document.getElementById('actionPortraitImg');
    const fallback=document.getElementById('actionPortraitFallback');
    if (imgEl) {
        if (portrait) {imgEl.src=portrait;imgEl.style.display='';if(fallback)fallback.style.display='none';}
        else {imgEl.style.display='none';if(fallback)fallback.style.display='flex';}
    }

    const titleEl=document.getElementById('actionModalTitle');
    if (titleEl) titleEl.textContent=name;
    const hpEl=document.getElementById('actionHP');
    if (hpEl) hpEl.textContent=char.hp+'/'+char.maxHp;
    const chEl=document.getElementById('actionCharges');
    if (chEl) chEl.textContent=char.charges||0;
    const shEl=document.getElementById('actionShield');
    const shVal=document.getElementById('actionShieldValue');
    if (shEl&&shVal){if(char.shield>0){shEl.style.display='';shVal.textContent=char.shield;}else shEl.style.display='none';}
    const passiveEl=document.getElementById('actionPassive');
    if (passiveEl) passiveEl.innerHTML=char.passive?'<div style="font-size:.68rem;color:#a78bfa;font-family:Chakra Petch,sans-serif;">✨ '+char.passive.name+'</div>':'';
    const levelEl=document.getElementById('actionLevel');
    if (levelEl){const v2=typeof CHARACTERS_V2!=='undefined'?CHARACTERS_V2[char.baseName||name]:null;levelEl.textContent=v2?'Nv '+v2.level+' · '+v2.xp+'/'+(typeof XPSystem!=='undefined'?XPSystem.xpNeeded(v2.level):'?')+' XP':'';}

    const statusEl=document.getElementById('actionStatusEffects');
    if (statusEl) {
        const pills=(char.statusEffects||[]).filter(function(e){return e&&!e.passiveHidden;}).slice(0,4)
            .map(function(e){const isBuff=e.type==='buff';const bg=isBuff?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.15)';const col=isBuff?'#6ee7b7':'#fca5a5';const dur=e.permanent?'':(e.duration>0?' ('+e.duration+'T)':'');return '<span style="font-size:.6rem;padding:1px 5px;border-radius:3px;background:'+bg+';color:'+col+';">'+(e.emoji||'')+' '+(e.name||'')+dur+'</span>';}).join('');
        statusEl.innerHTML=pills;
    }

    const abilitiesEl=document.getElementById('actionAbilities');
    if (abilitiesEl) {
        abilitiesEl.innerHTML='';
        (char.abilities||[]).forEach(function(ab,idx){
            let cost=ab.cost||0;
            if (char.rikudoMode) cost=Math.ceil(cost/2);
            const canAfford=(char.charges||0)>=cost;
            const typeClass=ab.type==='over'?'ability-btn-over':ab.type==='special'?'ability-btn-special':'ability-btn-basic';
            const typeBadge=ab.type==='over'?'badge-over':ab.type==='special'?'badge-violet':'badge-blue';
            const btn=document.createElement('button');
            btn.className='ability-btn '+typeClass;
            btn.disabled=!canAfford;
            (function(i){btn.onclick=function(){selectAbility(name,i);};})(idx);
            btn.innerHTML='<div style="flex:1;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><div class="ability-btn-name">'+(ab.name||'')+'</div><span class="badge '+typeBadge+'" style="flex-shrink:0;font-size:.6rem;">'+(ab.type||'').toUpperCase()+'</span></div><div class="ability-btn-desc">'+(ab.description||'')+'</div></div><div class="ability-btn-cost">'+(cost>0?'💎 '+cost:'🆓')+'</div>';
            abilitiesEl.appendChild(btn);
        });
    }

    modal.classList.add('show');
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

console.log('[UNIVERSUS] init-render.js v3.0 — cartas clickeables ✓');
