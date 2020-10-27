function runSim() {
  
  var SP = Number(document.getElementById("spellPower").value);
  var crit = Number(document.getElementById("spellCrit").value);
  var hit = Number(document.getElementById("spellHit").value);
  var int = Number(document.getElementById("intellect").value);
  var mp5 = Number(document.getElementById("mp5").value);
  var fightStart = Number(document.getElementById("fightStart").value);
  var fightEnd = Number(document.getElementById("fightEnd").value);
  
  var useAgony = false;
  var useCorruption = false;
  var useImmolate = false;
  var ZHC = false;
  var PI = 0;
  
  var race = document.getElementById("race").value;
  if (race == "gnome")
    var gnome = true;
  else
    var gnome = false;
  
  var timeVec = new Array;
  timeVec[0] = fightStart;
  for (var i=fightStart+0.5; i<=fightEnd; i=i+0.5)
    timeVec[timeVec.length] = i;
  var threatTime = 0;

  var hakkarBuff = document.getElementById("hakkarBuff").checked;
  var onyxiaBuff = document.getElementById("onyxiaBuff").checked;
  var songflower = document.getElementById("songflower").checked;
  var diremaulBuff = document.getElementById("diremaulBuff").checked;
  
  var manaExtra = 1800*document.getElementById("manaPotion").checked + 1200*document.getElementById("demonicRune").checked;
  var ShP = SP + 150*document.getElementById("supremeFlask").checked + 36*document.getElementById("brilliantOil").checked + 35*document.getElementById("arcaneElixir").checked + 40*document.getElementById("shadowElixir").checked + 23*document.getElementById("holiday").checked;
  var FiP = SP + 150*document.getElementById("supremeFlask").checked + 36*document.getElementById("brilliantOil").checked + 35*document.getElementById("arcaneElixir").checked + 40*document.getElementById("fireElixir").checked + 23*document.getElementById("holiday").checked;
  crit += 1*document.getElementById("brilliantOil").checked + 3*document.getElementById("moonkinAura").checked;
  int += 31*document.getElementById("arcaneIntellect").checked + 16*document.getElementById("markOfTheWild").checked;
  mp5 += 8*document.getElementById("nightfinSoup").checked + 10*document.getElementById("magebloodPotion").checked + 42*document.getElementById("blessingOfWisdom").checked + 25*document.getElementById("manaSpringTotem").checked;
  
  var sbCost = 380 * (1 - 0.01*document.getElementById("talentCataclysm").parentNode.children[1].innerHTML);
  var burnCost = 365 * (1 - 0.01*document.getElementById("talentCataclysm").parentNode.children[1].innerHTML);
  var sbTime = 3 - 0.1*document.getElementById("talentBane").parentNode.children[1].innerHTML;
  var GCD = 1.5;
  var corruptionCost = 290;
  var corruptionDuration = 18;
  var corruption = false;
  var agonyCost = 215;
  var agonyDuration = 24;
  var agony = false;
  var immolateCost = 380 * (1 - 0.01*document.getElementById("talentCataclysm").parentNode.children[1].innerHTML);
  var immolateDuration = 15;
  var immolate = false;
  var immolateTime = 2 - 0.1*document.getElementById("talentBane").parentNode.children[1].innerHTML;
  var burn = false;
  
  var shadowMultiplier = (1 + 0.15*document.getElementById("talentDemonicSacrifice").parentNode.children[1].innerHTML) * (1 + 0.1*document.getElementById("curseShadow").checked) * (1 + 0.15*document.getElementById("shadowWeaving").checked) * (1 + 0.02*document.getElementById("talentShadowMastery").parentNode.children[1].innerHTML) * (1 + 0.10*document.getElementById("darkMoonFaire").checked) * (1 + 0.05*document.getElementById("tracesOfSilithus").checked); //DS, CoS, Weaving, SM
  var fireMultiplier = (1 + 0.15*document.getElementById("talentDemonicSacrifice").parentNode.children[1].innerHTML) * (1 + 0.1*document.getElementById("curseElements").checked) * (1 + 0.15*document.getElementById("Scorch").checked) * (1 + 0.02*document.getElementById("talentEmberstorm").parentNode.children[1].innerHTML) * (1 + 0.10*document.getElementById("darkMoonFaire").checked) * (1 + 0.05*document.getElementById("tracesOfSilithus").checked);; //DS, CoE, Scorch, Emberstorm
  var critMultiplier = 1.5 + 0.5*document.getElementById("talentRuin").parentNode.children[1].innerHTML;
  
  for (var q=1; q<=6; q++) {
    if (q==1) {
      ShP = ShP + 1;
      FiP = FiP + 1;}
    else if (q==2) {
      ShP = ShP - 1;
      FiP = FiP - 1;
      int = int + 10;}
    else if (q==3) {
      int = int - 10;
      crit = crit + 1;}
    else if (q==4) {
      crit = crit - 1;
      hit = hit + 1;}
    else if (q==5) {
      hit = hit - 1;
      mp5 = mp5 + 3;}
    else if (q==6) {
      mp5 = mp5 - 3;}
    
    var intel = Math.round(int*(1 + 0.1*document.getElementById("blessingOfKings").checked)*(1 + 0.05*gnome)*(1 + 0.15*hakkarBuff));
    var manaMain = 1093 + intel*15 + manaExtra;
    var tapGain = (424+ShP*0.8) * (1 + 0.1*document.getElementById("talentLifeTap").parentNode.children[1].innerHTML);
    var avgNonCrit = (510.5+(ShP*6/7)) * shadowMultiplier;
    var avgBurn = (488+(ShP*3/7)) * shadowMultiplier;
    if (hit <= 16)
      var miss = 100 - 83 - hit;
    else
      var miss = 1;
    var critChance = (1.7 + crit + 5 + (intel/60.6) + 10*onyxiaBuff + 5*songflower + 3*diremaulBuff);
    var critFinal = (1.7 + crit + 5 + (intel/60.6) + 10*onyxiaBuff + 5*songflower + 3*diremaulBuff) * (100-miss)/100;
    var regularHit = 100-miss-critFinal;
    var shadowVuln = (1 - Math.pow(1 - critChance/100, 4/(1-miss/100))) * 0.2*document.getElementById("talentShadowBolt").parentNode.children[1].innerHTML;
    
    var DPS = new Array;
    var lifeTaps = new Array;
    var manaLeft = new Array;
    var time = threatTime;
    var damage = 0;
    var mana = manaMain;
    var timePast = 0;
    var SBC = 0;
    for (var i=0; i<timeVec.length; i++) {
      agony = false; corruption = false; time = threatTime; damage = 0; mana = manaMain; timePast = 0; burn = false; SBC = 0;
      if (useAgony == true)
        var agonyUse = 0;
      else {
        var agonyUse = Infinity;
        agony = true;}
      if (useCorruption == true)
        var corruptionUse = 0;
      else {
        var corruptionUse = Infinity;
        corruption = true;}
      if (useImmolate == true)
        var immolateUse = 0;
      else {
        var immolateUse = Infinity;
        immolate = true;}
      
      while (time <= timeVec[i]) {
        var timeLeft = timeVec[i]-time;
        mana = mana + (time-timePast) * mp5/5;
        timePast = time;
        
        if (agony == true && time>=agonyUse+agonyDuration)
          agony = false;
        if (corruption == true && time>=corruptionUse+corruptionDuration)
          corruption = false;
        if (immolate == true && time>=immolateUse+immolateDuration)
          immolate = false;
        if (mana < sbCost || (timeLeft<5)+(mana<sbCost+burnCost)+(timeLeft>1.5)==3) {
          if (timeLeft >= 2) {
              mana = mana + tapGain;
              lifeTaps[i]++;}
          time += GCD;}
        
        else if (agony == false && agonyDuration <= timeLeft) {
          agony = true; 
          agonyUse = time;
          damage += (1044*1.06);
          mana -= agonyCost;
          time += GCD;}
        
        else if (corruption == false && corruptionDuration <= timeLeft) {
          corruption = true; 
          corruptionUse = time;
          damage += 888;
          mana -= corruptionCost;
          time += GCD;}
        
        else if (immolate == false && immolateDuration <= timeLeft) {
          immolate = true; 
          immolateUse = time;
          damage += 1500;
          mana -= immolateCost;
          time += GCD;}
        
        else if (sbTime <= timeLeft) {
          damage += (avgNonCrit*critFinal*critMultiplier + avgNonCrit*regularHit)/100 * ((shadowVuln*0.2)+1);
          if (SBC == 0)
            damage -= (avgNonCrit*critFinal*critMultiplier + avgNonCrit*regularHit)/100 * ((shadowVuln*0.2));
          else if (SBC == 1)
            damage -= (avgNonCrit*critFinal*critMultiplier + avgNonCrit*regularHit)/100 * ((shadowVuln*0.2)) * (1-critFinal/100);
          else if (SBC == 2)
            damage -= (avgNonCrit*critFinal*critMultiplier + avgNonCrit*regularHit)/100 * ((shadowVuln*0.2)) * Math.pow(1-critFinal/100,2);
          else if (SBC == 3)
            damage -= (avgNonCrit*critFinal*critMultiplier + avgNonCrit*regularHit)/100 * ((shadowVuln*0.2)) * Math.pow(1-critFinal/100,3);
          mana -= sbCost;
          time += sbTime;
          SBC++;}
        
        else if (sbTime > timeLeft) {
          damage += (avgBurn*critFinal*critMultiplier + avgBurn*regularHit)/100 * ((shadowVuln*0.2)+1);
          mana -= burnCost;
          time += GCD*2;
          burn = true;
        }
      }
      damage = damage*0.94;
      DPS[i] = damage/timeVec[i];
      manaLeft[i] = mana;
    } //Loop with timeVec
    
    if (q==1) {
      var SPDPS   = math.sum(DPS)/DPS.length;
      var SPVec   = DPS;}
    else if (q==2) {
      var intDPS  = math.sum(DPS)/DPS.length;
      var intVec  = DPS;}
    else if (q==3) {
      var critDPS = math.sum(DPS)/DPS.length;
      var critVec = DPS;}
    else if (q==4) {
      var hitDPS  = math.sum(DPS)/DPS.length;
      var hitVec  = DPS;}
    else if (q==5) {
      var mp5DPS  = math.sum(DPS)/DPS.length;
      var mp5Vec  = DPS;}
    else if (q==6) {
      var baseDPS = math.sum(DPS)/DPS.length;
      var baseVec = DPS;}
  } //Loop with q
  var SPVal   = (SPDPS-baseDPS);
  var intVal  = (intDPS-baseDPS);
  var critVal = (critDPS-baseDPS);
  var hitVal  = (hitDPS-baseDPS);
  
  var dpsOutput = "<h2>" + formatNumber(math.sum(baseVec)/baseVec.length,2) + " <span style='font-size:14px'>DPS</span></h2>";
  var statWeightOutput = "<h2><span style='font-size:18px'>Crit = " + formatNumber(critVal/SPVal,2) + " SP, Hit = " + formatNumber(hitVal/SPVal,2) + " SP</span> </h2>";

  document.getElementById("dps").innerHTML = dpsOutput;
  document.getElementById("statWeights").innerHTML = statWeightOutput;
  document.getElementById("finalStats").innerHTML = "<table class='finalStats' style=text-align:left><tr><th colspan=2>Stats</th></tr><tr><td>Shadow Power</td><td>&nbsp" + ShP + "</td></tr><tr><td>Fire Power</td><td>&nbsp" + FiP + "</td></tr><tr><td>Crit Chance</td><td>&nbsp" + formatNumber(critChance,2) + "%</td></tr><tr><td>Hit Chance</td><td>&nbsp" + Number(100-miss) + "%</td></tr><tr><td>Intellect</td><td>&nbsp" + intel + "</td></tr><tr><td>Mana per 5</td><td>&nbsp" + mp5 + "</td></tr><tr><td>Total Mana</td><td>&nbsp" + manaMain + "</td></tr><tr><td>Shadow Multiplier</td><td>&nbsp" + formatNumber(shadowMultiplier,4) + "</td></tr><tr><td>Fire Multiplier</td><td>&nbsp" + formatNumber(fireMultiplier,4) + "</td></tr></table>";
  
  var dpsChart = new Chart(document.getElementById('dpsChart'), {
    type: 'line',
    data: {
      labels: timeVec,
      datasets: [{
        label: "Current Settings",
        data: DPS,
        fill: false,
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
        borderColor: 'rgba(255, 0, 0, 0.3)'
      }]
    },
    options: {
      scales: {xAxes: [{ticks: {autoSkipPadding: 2}}], yAxes: [{ticks: {beginAtZero: true, max: 1600} }] },
      animation: {duration: 0},
      events: [],
      title: {display: true, fontSize: 20, text: "DPS Graph"}
    }
  });
  
  SPVec = math.subtract(SPVec,baseVec);
  critVec = math.subtract(critVec,baseVec);
  hitVec = math.subtract(hitVec,baseVec);
  intVec = math.divide(math.subtract(intVec,baseVec),10);
  mp5Vec = math.divide(math.subtract(mp5Vec,baseVec),3);
  
  var statWeightChart = new Chart(document.getElementById('statWeightChart'), {
    type: 'line',
    data: {
      labels: timeVec,
      datasets: [{
        label: "Crit Value",
        data: math.dotDivide(critVec,SPVec),
        fill: false,
        lineTension: 0,
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
        borderColor: 'rgba(255, 0, 0, 0.3)'},
                 {
        label: "Hit Value",
        data: math.dotDivide(hitVec,SPVec),
        fill: false,
        lineTension: 0,
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        borderColor: 'rgba(255, 255, 0, 0.3)'},
                 {
        label: "Int Value",
        data: math.dotDivide(intVec,SPVec),
        fill: false,
        lineTension: 0,
        backgroundColor: 'rgba(0, 0, 255, 0.4)',
        borderColor: 'rgba(0, 0, 255, 0.3)'},
                 {
        label: "Mp5 Value",
        data: math.dotDivide(mp5Vec,SPVec),
        fill: false,
        lineTension: 0,
        backgroundColor: 'rgba(255, 0, 255, 0.4)',
        borderColor: 'rgba(255, 0, 255, 0.3)'},
                 {
        label: "DPS per SP",
        data: SPVec,
        fill: false,
        lineTension: 0,
        backgroundColor: 'rgba(0, 255, 0, 0.4)',
        borderColor: 'rgba(0, 255, 0, 0.3)'}]
    },
    options: {
      scales: {xAxes: [{ticks: {autoSkipPadding: 2}}], yAxes: [{ticks: {beginAtZero: true} }] },
      animation: {duration: 0},
      events: [],
      title: {display: true, fontSize: 20, text: "Stat Weights Graph"}
    }
  });
  
} //Function

function formatNumber(num, places) {
  return +(Math.round(num + "e+" + places)  + "e-" + places);
}

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
}
